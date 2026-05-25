// src/views/AnnotationView.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Panel, Pill } from '../components/ui'
import { useZones } from '../lib/zonesStore'
import { useToast } from '../lib/toast'

export default function AnnotationView() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const fileInputRef = useRef(null)
  const importInputRef = useRef(null)
  const toast = useToast()
  const { activeZones } = useZones()
  // Live admin-managed zones. Fall back to empty list if none.
  const ZONES = activeZones

  const [image, setImage] = useState(null)
  const [imageInfo, setImageInfo] = useState({ name: 'No image loaded', width: 0, height: 0 })
  const [polygons, setPolygons] = useState([])
  const [currentPoints, setCurrentPoints] = useState([])
  const [mode, setMode] = useState('draw')
  const [selectedZone, setSelectedZone] = useState('A')
  const [selectedPolygonId, setSelectedPolygonId] = useState(null)
  const [hoverPoint, setHoverPoint] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState(null)
  const [showLabels, setShowLabels] = useState(true)
  const [nameModal, setNameModal] = useState(null)

  const suggestNextId = (zone) => {
    const zoneSpots = polygons.filter(p => p.zone === zone)
    const nums = zoneSpots
      .map(p => parseInt(p.id.split('-')[1], 10))
      .filter(n => !isNaN(n))
    const next = nums.length ? Math.max(...nums) + 1 : 1
    return `${zone}-${String(next).padStart(2, '0')}`
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        setImage(img)
        setImageInfo({ name: file.name, width: img.width, height: img.height })
        setZoom(1)
        setPan({ x: 0, y: 0 })
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const loadDemoImage = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 1280
    canvas.height = 720
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#1a1d24'
    ctx.fillRect(0, 0, 1280, 720)
    ctx.strokeStyle = '#ffb83d'
    ctx.lineWidth = 3
    ctx.setLineDash([20, 8])
    for (let i = 0; i < 9; i++) {
      ctx.beginPath()
      ctx.moveTo(120 + i * 130, 100)
      ctx.lineTo(120 + i * 130, 620)
      ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.strokeStyle = '#ffb83d'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(120, 360)
    ctx.lineTo(1160, 360)
    ctx.stroke()
    const carColors = ['#3b4b66', '#5a3b3b', '#2a3a4a', '#4a3b2a', '#3a4a3a']
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 8; col++) {
        if (Math.random() < 0.55) {
          ctx.fillStyle = carColors[Math.floor(Math.random() * carColors.length)]
          const x = 130 + col * 130
          const y = row === 0 ? 130 : 390
          ctx.fillRect(x, y, 110, 200)
          ctx.fillStyle = 'rgba(255,255,255,0.05)'
          ctx.fillRect(x + 15, y + (row === 0 ? 30 : 130), 80, 40)
        }
      }
    }
    ctx.fillStyle = 'rgba(255,184,61,0.6)'
    ctx.font = 'bold 18px monospace'
    ctx.fillText('CAM_NORTH_01 · DEMO FRAME · 1280x720', 30, 40)

    const img = new Image()
    img.onload = () => {
      setImage(img)
      setImageInfo({ name: 'demo_frame.png', width: 1280, height: 720 })
      setZoom(1)
      setPan({ x: 0, y: 0 })
    }
    img.src = canvas.toDataURL()
  }

  const screenToImage = (sx, sy) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (sx - rect.left - pan.x) / zoom
    const y = (sy - rect.top - pan.y) / zoom
    return { x, y }
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#0a0c10'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (!image) {
      ctx.fillStyle = '#8C8676'
      ctx.font = '14px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('Upload a camera frame to begin annotation', canvas.width / 2, canvas.height / 2)
      ctx.fillText('Or click "Demo image" to try the tool', canvas.width / 2, canvas.height / 2 + 24)
      return
    }

    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)
    ctx.drawImage(image, 0, 0)

    polygons.forEach(poly => {
      const zoneColor = ZONES.find(z => z.id === poly.zone)?.color || '#163A6E'
      const isSelected = selectedPolygonId === poly.id

      ctx.beginPath()
      poly.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p[0], p[1])
        else ctx.lineTo(p[0], p[1])
      })
      ctx.closePath()

      ctx.fillStyle = isSelected ? `${zoneColor}55` : `${zoneColor}22`
      ctx.fill()
      ctx.strokeStyle = isSelected ? '#ffffff' : zoneColor
      ctx.lineWidth = (isSelected ? 3 : 2) / zoom
      ctx.stroke()

      if (isSelected) {
        poly.points.forEach(p => {
          ctx.beginPath()
          ctx.arc(p[0], p[1], 5 / zoom, 0, Math.PI * 2)
          ctx.fillStyle = '#ffffff'
          ctx.fill()
        })
      }

      if (showLabels) {
        const cx = poly.points.reduce((s, p) => s + p[0], 0) / poly.points.length
        const cy = poly.points.reduce((s, p) => s + p[1], 0) / poly.points.length
        ctx.font = `bold ${12 / zoom}px monospace`
        ctx.textAlign = 'center'
        ctx.fillStyle = '#ffffff'
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 3 / zoom
        ctx.strokeText(poly.id, cx, cy + 4 / zoom)
        ctx.fillText(poly.id, cx, cy + 4 / zoom)
      }
    })

    if (currentPoints.length > 0) {
      ctx.beginPath()
      currentPoints.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p[0], p[1])
        else ctx.lineTo(p[0], p[1])
      })
      if (hoverPoint) ctx.lineTo(hoverPoint.x, hoverPoint.y)
      ctx.strokeStyle = '#E4B228'
      ctx.lineWidth = 2 / zoom
      ctx.setLineDash([6 / zoom, 4 / zoom])
      ctx.stroke()
      ctx.setLineDash([])

      currentPoints.forEach((p, i) => {
        ctx.beginPath()
        ctx.arc(p[0], p[1], 5 / zoom, 0, Math.PI * 2)
        ctx.fillStyle = i === 0 ? '#1F8A5B' : '#E4B228'
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2 / zoom
        ctx.stroke()
      })
    }

    ctx.restore()
  }, [image, polygons, currentPoints, hoverPoint, zoom, pan, selectedPolygonId, showLabels])

  useEffect(() => { draw() }, [draw])

  // Keep selectedZone valid as admin-managed zones change.
  useEffect(() => {
    if (ZONES.length === 0) return
    if (!ZONES.some(z => z.id === selectedZone)) {
      setSelectedZone(ZONES[0].id)
    }
  }, [ZONES, selectedZone])

  useEffect(() => {
    const resize = () => {
      if (!containerRef.current || !canvasRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      canvasRef.current.width = rect.width
      canvasRef.current.height = rect.height
      draw()
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [draw])

  const pointInPolygon = (x, y, points) => {
    let inside = false
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i][0], yi = points[i][1]
      const xj = points[j][0], yj = points[j][1]
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
      if (intersect) inside = !inside
    }
    return inside
  }

  const handleMouseDown = (e) => {
    if (e.button === 2) return
    if (e.shiftKey || e.button === 1) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      return
    }
    const { x, y } = screenToImage(e.clientX, e.clientY)
    if (mode === 'select') {
      const hit = polygons.find(p => pointInPolygon(x, y, p.points))
      setSelectedPolygonId(hit?.id || null)
      return
    }
    if (!image) return
    setCurrentPoints(prev => [...prev, [x, y]])
  }

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
      return
    }
    const { x, y } = screenToImage(e.clientX, e.clientY)
    setHoverPoint({ x, y })
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setPanStart(null)
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = -e.deltaY * 0.001
    const newZoom = Math.max(0.2, Math.min(5, zoom + delta))
    const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const zoomRatio = newZoom / zoom
    setPan(prev => ({
      x: mouseX - (mouseX - prev.x) * zoomRatio,
      y: mouseY - (mouseY - prev.y) * zoomRatio,
    }))
    setZoom(newZoom)
  }

  const closePolygon = () => {
    if (currentPoints.length < 3) {
      toast.warn('Not enough points', 'A polygon needs at least 3 points')
      return
    }
    setNameModal({ points: currentPoints, zone: selectedZone })
  }

  const confirmPolygon = (id) => {
    if (!id || polygons.some(p => p.id === id)) {
      toast.error('Invalid ID', 'ID must be unique and non-empty')
      return
    }
    setPolygons(prev => [...prev, { id, zone: nameModal.zone, points: nameModal.points }])
    setCurrentPoints([])
    setNameModal(null)
  }

  const cancelCurrentPolygon = () => setCurrentPoints([])
  const undoLastPoint = () => setCurrentPoints(prev => prev.slice(0, -1))

  const deletePolygon = (id) => {
    setPolygons(prev => prev.filter(p => p.id !== id))
    if (selectedPolygonId === id) setSelectedPolygonId(null)
  }

  useEffect(() => {
    const handler = (e) => {
      if (nameModal) return
      if (e.key === 'Enter' && currentPoints.length >= 3) closePolygon()
      if (e.key === 'Escape') cancelCurrentPolygon()
      if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        undoLastPoint()
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (mode === 'select' && selectedPolygonId) deletePolygon(selectedPolygonId)
      }
      if (e.key === 'd' || e.key === 'D') setMode('draw')
      if (e.key === 's' || e.key === 'S') setMode('select')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentPoints, mode, selectedPolygonId, nameModal])

  const exportJSON = () => {
    const data = {
      camera: imageInfo.name,
      image_size: { width: imageInfo.width, height: imageInfo.height },
      generated_at: new Date().toISOString(),
      generated_by: 'Zweho Park Annotation Tool',
      polygons: polygons.map(p => ({
        id: p.id,
        zone: p.zone,
        points: p.points.map(pt => [Math.round(pt[0]), Math.round(pt[1])]),
      })),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zweho-zones-${imageInfo.name.replace(/\.[^/.]+$/, '')}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Polygons exported', `${polygons.length} polygon${polygons.length !== 1 ? 's' : ''} ready for Hafiz`)
  }

  const importJSON = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!Array.isArray(data.polygons)) throw new Error('Invalid format')
        setPolygons(data.polygons)
        toast.success('Import complete', `${data.polygons.length} polygons loaded`)
      } catch (err) {
        toast.error('Import failed', err.message)
      }
    }
    reader.readAsText(file)
  }

  const polygonsByZone = ZONES.map(z => ({
    ...z,
    count: polygons.filter(p => p.zone === z.id).length,
  }))

  // Reusable toolbar button style
  const toolBtn = {
    background: 'var(--zp-surface-2)',
    color: 'var(--zp-ink-2)',
    border: '1px solid var(--zp-line)',
  }

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--zp-ink)', fontFamily: 'var(--zp-font-ui)' }}>
            Spot Annotation Tool
          </h1>
          <p className="zp-eyebrow mt-1.5">
            CV pipeline setup · Polygon mapping · Generates JSON for edge device
          </p>
        </div>
        <Pill variant={polygons.length > 0 ? 'success' : 'default'}>
          {polygons.length} polygon{polygons.length !== 1 ? 's' : ''} drawn
        </Pill>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT: Toolbar + canvas */}
        <div className="lg:col-span-9 space-y-3">
          {/* Toolbar */}
          <div className="zp-card p-3 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 pr-3" style={{ borderRight: '1px solid var(--zp-line)' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                style={toolBtn}
              >
                Upload frame
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              <button
                onClick={loadDemoImage}
                className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                style={toolBtn}
              >
                Demo image
              </button>
            </div>

            <div className="flex items-center gap-1 pr-3" style={{ borderRight: '1px solid var(--zp-line)' }}>
              <button
                onClick={() => setMode('draw')}
                className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                style={{
                  background: mode === 'draw' ? 'var(--zp-primary)' : 'var(--zp-surface-2)',
                  color: mode === 'draw' ? '#fff' : 'var(--zp-ink-2)',
                  border: '1px solid ' + (mode === 'draw' ? 'var(--zp-primary)' : 'var(--zp-line)'),
                }}
              >
                Draw (D)
              </button>
              <button
                onClick={() => setMode('select')}
                className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                style={{
                  background: mode === 'select' ? 'var(--zp-primary)' : 'var(--zp-surface-2)',
                  color: mode === 'select' ? '#fff' : 'var(--zp-ink-2)',
                  border: '1px solid ' + (mode === 'select' ? 'var(--zp-primary)' : 'var(--zp-line)'),
                }}
              >
                Select (S)
              </button>
            </div>

            {mode === 'draw' && (
              <div className="flex items-center gap-1.5 pr-3" style={{ borderRight: '1px solid var(--zp-line)' }}>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--zp-ink-3)' }}>Zone:</span>
                {ZONES.map(z => (
                  <button
                    key={z.id}
                    onClick={() => setSelectedZone(z.id)}
                    className="px-2 py-1 text-[11px] font-mono font-bold rounded-md"
                    style={{
                      background: selectedZone === z.id ? z.color : 'transparent',
                      color: selectedZone === z.id ? '#fff' : z.color,
                      border: '1px solid ' + z.color + '60',
                    }}
                  >
                    {z.id}
                  </button>
                ))}
              </div>
            )}

            {currentPoints.length > 0 && (
              <div className="flex items-center gap-1 pr-3" style={{ borderRight: '1px solid var(--zp-line)' }}>
                <button
                  onClick={undoLastPoint}
                  className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                  style={toolBtn}
                >Undo</button>
                <button
                  onClick={closePolygon}
                  disabled={currentPoints.length < 3}
                  className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold disabled:opacity-50"
                  style={{ background: 'var(--zp-free-soft)', color: 'var(--zp-free)', border: '1px solid color-mix(in srgb, var(--zp-free) 30%, transparent)' }}
                >Close ({currentPoints.length}pts)</button>
                <button
                  onClick={cancelCurrentPolygon}
                  className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                  style={{ background: 'var(--zp-full-soft)', color: 'var(--zp-full)', border: '1px solid color-mix(in srgb, var(--zp-full) 30%, transparent)' }}
                >Cancel</button>
              </div>
            )}

            <div className="flex items-center gap-1 pr-3" style={{ borderRight: '1px solid var(--zp-line)' }}>
              <button
                onClick={() => setZoom(z => Math.max(0.2, z - 0.2))}
                className="w-7 h-7 text-xs rounded-md font-semibold"
                style={toolBtn}
              >−</button>
              <span className="font-mono text-[11px] w-12 text-center" style={{ color: 'var(--zp-ink)' }}>{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(z => Math.min(5, z + 0.2))}
                className="w-7 h-7 text-xs rounded-md font-semibold"
                style={toolBtn}
              >+</button>
              <button
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
                className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] rounded-md ml-1 font-semibold"
                style={toolBtn}
              >Reset</button>
            </div>

            <label className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] cursor-pointer" style={{ color: 'var(--zp-ink-2)' }}>
              <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} style={{ accentColor: 'var(--zp-primary)' }} />
              Labels
            </label>

            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => importInputRef.current?.click()}
                className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
                style={toolBtn}
              >Import</button>
              <input ref={importInputRef} type="file" accept=".json" onChange={importJSON} className="hidden" />
              <button
                onClick={exportJSON}
                disabled={polygons.length === 0}
                className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold disabled:opacity-40"
                style={{ background: 'var(--zp-primary)', color: '#fff' }}
              >Export JSON</button>
            </div>
          </div>

          {/* Canvas */}
          <div
            ref={containerRef}
            className="zp-map-surface rounded-md relative overflow-hidden"
            style={{ height: '600px', cursor: isPanning ? 'grabbing' : mode === 'draw' ? 'crosshair' : 'pointer' }}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              onContextMenu={e => e.preventDefault()}
              className="block"
            />
            <div className="absolute top-2 left-3 font-mono text-[10px] uppercase tracking-[0.14em] pointer-events-none" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <div>{imageInfo.name}</div>
              {imageInfo.width > 0 && <div>{imageInfo.width} × {imageInfo.height}</div>}
            </div>
            {hoverPoint && image && (
              <div className="absolute bottom-2 right-3 font-mono text-[10px] pointer-events-none" style={{ color: 'rgba(255,255,255,0.5)' }}>
                x: {Math.round(hoverPoint.x)} · y: {Math.round(hoverPoint.y)}
              </div>
            )}
            <div className="absolute bottom-2 left-3 font-mono text-[10px] uppercase tracking-[0.14em] pointer-events-none" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {mode === 'draw' ? 'Click to add point · Enter to close · Esc to cancel' : 'Click polygon to select · Del to remove'} · Shift+drag to pan · Scroll to zoom
            </div>
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="lg:col-span-3 space-y-3">
          <Panel title="Zone Summary" subtitle="Polygons per lot">
            <div className="space-y-2">
              {polygonsByZone.map(z => (
                <div key={z.id} className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: z.color }}></div>
                    <span style={{ color: 'var(--zp-ink)' }}>Zone {z.id}</span>
                  </div>
                  <span className="font-mono tabular-nums" style={{ color: 'var(--zp-ink-2)' }}>{z.count} / {z.capacity}</span>
                </div>
              ))}
              <div className="pt-2 flex items-center justify-between text-[13px]" style={{ borderTop: '1px solid var(--zp-line)' }}>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: 'var(--zp-ink-3)' }}>Total</span>
                <span className="font-mono tabular-nums font-semibold" style={{ color: 'var(--zp-ink)' }}>{polygons.length}</span>
              </div>
            </div>
          </Panel>

          <Panel title="Polygons" subtitle="Click to highlight">
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {polygons.length === 0 ? (
                <div className="text-[12px] py-3 text-center" style={{ color: 'var(--zp-ink-3)' }}>
                  No polygons yet. Switch to Draw mode and click points to begin.
                </div>
              ) : (
                polygons.map(p => {
                  const color = ZONES.find(z => z.id === p.zone)?.color || '#163A6E'
                  const isSel = selectedPolygonId === p.id
                  return (
                    <div
                      key={p.id}
                      onClick={() => { setSelectedPolygonId(p.id); setMode('select') }}
                      className="flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors"
                      style={{ background: isSel ? 'var(--zp-primary-soft)' : 'transparent' }}
                      onMouseEnter={el => { if (!isSel) el.currentTarget.style.background = 'var(--zp-surface-2)' }}
                      onMouseLeave={el => { if (!isSel) el.currentTarget.style.background = 'transparent' }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }}></div>
                        <span className="font-mono text-[12px] font-semibold" style={{ color: 'var(--zp-ink)' }}>{p.id}</span>
                        <span className="font-mono text-[10px]" style={{ color: 'var(--zp-ink-3)' }}>{p.points.length}pts</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deletePolygon(p.id) }}
                        className="text-[12px] px-1.5 py-0.5 rounded font-semibold"
                        style={{ color: 'var(--zp-full)' }}
                      >✕</button>
                    </div>
                  )
                })
              )}
            </div>
          </Panel>

          <Panel title="Keyboard Shortcuts">
            <div className="space-y-1.5 text-[11px]">
              <ShortcutRow keys="D" label="Draw mode" />
              <ShortcutRow keys="S" label="Select mode" />
              <ShortcutRow keys="Enter" label="Close polygon" />
              <ShortcutRow keys="Esc" label="Cancel current" />
              <ShortcutRow keys="Ctrl+Z" label="Undo last point" />
              <ShortcutRow keys="Del" label="Delete selected" />
              <ShortcutRow keys="Scroll" label="Zoom in/out" />
              <ShortcutRow keys="Shift+Drag" label="Pan canvas" />
            </div>
          </Panel>
        </div>
      </div>

      {nameModal && (
        <NameModal
          suggestedId={suggestNextId(nameModal.zone)}
          zone={nameModal.zone}
          onConfirm={confirmPolygon}
          onCancel={() => { setNameModal(null) }}
        />
      )}
    </div>
  )
}

function ShortcutRow({ keys, label }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: 'var(--zp-ink-2)' }}>{label}</span>
      <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded"
        style={{ background: 'var(--zp-surface-2)', border: '1px solid var(--zp-line)', color: 'var(--zp-ink)' }}>
        {keys}
      </kbd>
    </div>
  )
}

function NameModal({ suggestedId, zone, onConfirm, onCancel }) {
  const [value, setValue] = useState(suggestedId)
  const inputRef = useRef(null)
  useEffect(() => { inputRef.current?.select() }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="zp-card p-6 w-96" style={{ boxShadow: 'var(--zp-shadow-3)' }}>
        <h3 className="text-lg font-semibold" style={{ color: 'var(--zp-ink)', fontFamily: 'var(--zp-font-ui)' }}>Name this polygon</h3>
        <p className="zp-eyebrow mt-1">Zone {zone}</p>
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value.toUpperCase())}
          onKeyDown={e => { if (e.key === 'Enter') onConfirm(value); if (e.key === 'Escape') onCancel() }}
          className="w-full mt-4 rounded-md px-3 py-2.5 text-[14px] font-mono outline-none"
          style={{ background: 'var(--zp-surface-2)', border: '1px solid var(--zp-line)', color: 'var(--zp-ink)' }}
        />
        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
            style={{ background: 'var(--zp-surface-2)', color: 'var(--zp-ink-2)', border: '1px solid var(--zp-line)' }}
          >Cancel</button>
          <button
            onClick={() => onConfirm(value)}
            className="flex-1 py-2 text-[11px] font-mono uppercase tracking-[0.14em] rounded-md font-semibold"
            style={{ background: 'var(--zp-primary)', color: '#fff' }}
          >Save polygon →</button>
        </div>
      </div>
    </div>
  )
}