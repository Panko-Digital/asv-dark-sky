import React, { useEffect, useRef, useState } from 'react';

function LightPollutionMap() {
  const canvasRef = useRef(null);
  const [rendering, setRendering] = useState(false);
  const [mapData, setMapData] = useState({
    centerLat: -37.8136,
    centerLng: 144.9631,
    radiusKm: 500,
    width: 800,
    height: 800,
    smoothness: 80,
    threshold: 0.15,
    opacity: 0.7,
    mapboxToken: ''
  });

  const [pointCount, setPointCount] = useState(74);
  
  const generateInitialPoints = () => {
    const fixed = [
      [-37.8136, 144.9631, 0.95],
      [-37.8100, 144.9700, 0.90],
      [-37.8200, 144.9500, 0.85],
      [-37.7500, 144.9631, 0.65],
      [-37.8800, 144.9631, 0.60],
      [-37.8136, 145.0500, 0.70],
      [-37.8136, 144.8700, 0.55],
      [-37.6000, 144.9631, 0.35],
      [-38.0000, 144.9631, 0.30],
      [-37.8136, 145.3000, 0.40],
      [-37.8136, 144.6000, 0.25],
      [-38.1499, 144.3617, 0.50],
      [-36.7570, 144.2794, 0.45],
      [-37.5622, 143.8503, 0.35]
    ];
    
    const random = [];
    for (let i = 0; i < 60; i++) {
      const lat = -37.8136 + (Math.random() - 0.5) * 4;
      const lng = 144.9631 + (Math.random() - 0.5) * 4;
      const intensity = Math.random() * 0.7 + 0.1;
      random.push([lat, lng, intensity]);
    }
    
    return [...fixed, ...random];
  };
  
  const [dataPoints, setDataPoints] = useState(generateInitialPoints());

  function generateRandomDataset(count) {
    const { centerLat, centerLng, radiusKm } = mapData;
    const spread = radiusKm / 111.32 * 1.6; // Convert km to approximate degrees
    
    const newPoints = [];
    for (let i = 0; i < count; i++) {
      const lat = centerLat + (Math.random() - 0.5) * spread;
      const lng = centerLng + (Math.random() - 0.5) * spread;
      const intensity = Math.random() * 0.9 + 0.1;
      newPoints.push([lat, lng, intensity]);
    }
    setDataPoints(newPoints);
    setPointCount(count);
  }

  function getDistance(lat1, lng1, lat2, lng2) {
    const dLat = (lat2 - lat1) * 111.32;
    const dLng = (lng2 - lng1) * 111.32 * Math.cos((lat1 + lat2) / 2 * Math.PI / 180);
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }

  function pixelToLatLng(x, y, centerLat, centerLng, radiusKm, width, height) {
    const kmPerDegreeLat = 111.32;
    const kmPerDegreeLng = 111.32 * Math.cos(centerLat * Math.PI / 180);
    const scale = Math.min(width, height) / (radiusKm * 2);
    const deltaLng = (x - width / 2) / scale;
    const deltaLat = -(y - height / 2) / scale;
    const lat = centerLat + deltaLat / kmPerDegreeLat;
    const lng = centerLng + deltaLng / kmPerDegreeLng;
    return { lat, lng };
  }

  function interpolateColor(value) {
    value = Math.max(0, Math.min(1, value));
    let r, g, b;
    
    if (value < 0.33) {
      const t = value / 0.33;
      r = Math.round(t * 255);
      g = 255;
      b = 0;
    } else if (value < 0.66) {
      const t = (value - 0.33) / 0.33;
      r = 255;
      g = Math.round(255 - t * 100);
      b = 0;
    } else {
      const t = (value - 0.66) / 0.34;
      r = 255;
      g = Math.round(155 * (1 - t));
      b = 0;
    }
    
    return { r, g, b };
  }

  async function loadMapBackground(ctx, lat, lng, zoom, width, height) {
    // Use static map API approach
    const mapWidth = width;
    const mapHeight = height;
    
    // Create a simple grayscale map background using a static map service
    // Using Wikimedia maps which allows CORS
    const mapUrl = `https://maps.wikimedia.org/osm-intl/${zoom}/${lat}/${lng}@2x.png`;
    
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => {
          // Fallback to dark gray background with grid if map fails
          console.log('Map tiles failed to load, using fallback background');
          resolve();
        };
        img.src = mapUrl;
      });
      
      if (img.complete && img.naturalHeight !== 0) {
        // Draw the map centered and scaled
        const scale = Math.min(width / img.width, height / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetX = (width - scaledWidth) / 2;
        const offsetY = (height - scaledHeight) / 2;
        
        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
      } else {
        throw new Error('Image failed to load');
      }
    } catch (error) {
      // Fallback: Draw a styled background
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(0, 0, width, height);
      
      // Draw grid to show geography context
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      const gridSpacing = 50;
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
  }

  // Metaball-style smooth field calculation
  function calculateMetaballField(lat, lng, points, smoothness) {
    let sum = 0;
    
    for (let i = 0; i < points.length; i++) {
      const [pLat, pLng, intensity] = points[i];
      const distance = getDistance(lat, lng, pLat, pLng);
      
      // Metaball formula: contribution falls off with distance
      // Using Gaussian-like falloff for smooth organic shapes
      const contribution = intensity * Math.exp(-distance / smoothness);
      sum += contribution;
    }
    
    return sum;
  }

  async function drawHeatmap() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setRendering(true);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const ctx = canvas.getContext('2d', { alpha: false });
    const { width, height, centerLat, centerLng, radiusKm, smoothness, threshold, opacity } = mapData;
    
    // Load OpenStreetMap tile as background
    const zoom = Math.floor(Math.log2(360 / (radiusKm * 2 / 111.32)));
    const tileUrl = await loadMapBackground(ctx, centerLat, centerLng, zoom, width, height);
    
    // Calculate field values for entire grid
    const step = 2;
    const gridWidth = Math.ceil(width / step);
    const gridHeight = Math.ceil(height / step);
    const field = new Float32Array(gridWidth * gridHeight);
    
    // Calculate raw field values
    for (let gy = 0; gy < gridHeight; gy++) {
      for (let gx = 0; gx < gridWidth; gx++) {
        const x = gx * step;
        const y = gy * step;
        const { lat, lng } = pixelToLatLng(x, y, centerLat, centerLng, radiusKm, width, height);
        const value = calculateMetaballField(lat, lng, dataPoints, smoothness);
        field[gy * gridWidth + gx] = value;
      }
      
      if (gy % 20 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    // Find min/max for normalization
    let minVal = Infinity, maxVal = -Infinity;
    for (let i = 0; i < field.length; i++) {
      if (field[i] > threshold) {
        minVal = Math.min(minVal, field[i]);
        maxVal = Math.max(maxVal, field[i]);
      }
    }
    
    // Create image data
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    // Render with bilinear interpolation for smoothness
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const gx = x / step;
        const gy = y / step;
        const gx0 = Math.floor(gx);
        const gy0 = Math.floor(gy);
        const gx1 = Math.min(gx0 + 1, gridWidth - 1);
        const gy1 = Math.min(gy0 + 1, gridHeight - 1);
        
        // Bilinear interpolation
        const fx = gx - gx0;
        const fy = gy - gy0;
        
        const v00 = field[gy0 * gridWidth + gx0];
        const v10 = field[gy0 * gridWidth + gx1];
        const v01 = field[gy1 * gridWidth + gx0];
        const v11 = field[gy1 * gridWidth + gx1];
        
        const v0 = v00 * (1 - fx) + v10 * fx;
        const v1 = v01 * (1 - fx) + v11 * fx;
        const value = v0 * (1 - fy) + v1 * fy;
        
        if (value > threshold) {
          // Normalize to 0-1 range
          const normalized = (value - minVal) / (maxVal - minVal);
          
          // Apply feathering at edges
          let edgeFade = 1;
          const edgeDistance = 30;
          const distToEdge = Math.min(x, y, width - x, height - y);
          if (distToEdge < edgeDistance) {
            edgeFade = distToEdge / edgeDistance;
          }
          
          // Soft threshold fade
          const softThreshold = threshold * 1.5;
          let thresholdFade = 1;
          if (value < softThreshold) {
            thresholdFade = (value - threshold) / (softThreshold - threshold);
          }
          
          const finalValue = normalized * edgeFade * thresholdFade;
          const color = interpolateColor(finalValue);
          
          const idx = (y * width + x) * 4;
          data[idx] = color.r;
          data[idx + 1] = color.g;
          data[idx + 2] = color.b;
          data[idx + 3] = Math.round(Math.min(255, finalValue * 255 * opacity));
        }
      }
      
      if (y % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Apply composite mode for better blending with map
    ctx.globalCompositeOperation = 'screen';
    
    // Multi-pass blur for ultra-smooth appearance
    for (let pass = 0; pass < 2; pass++) {
      ctx.filter = 'blur(8px)';
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
      ctx.drawImage(tempCanvas, 0, 0);
    }
    
    ctx.globalCompositeOperation = 'source-over';
    
    // Subtle grid overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = width / 10;
    for (let i = 1; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gridSize, 0);
      ctx.lineTo(i * gridSize, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * gridSize);
      ctx.lineTo(width, i * gridSize);
      ctx.stroke();
    }
    
    // Title and info
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Light Pollution Map', 20, 35);
    ctx.font = '14px sans-serif';
    ctx.fillText(`${radiusKm}km radius | ${dataPoints.length} points`, 20, 58);
    
    // Legend
    const legendX = width - 180;
    const legendY = 30;
    const legendWidth = 160;
    const legendHeight = 15;
    
    const gradient = ctx.createLinearGradient(legendX, 0, legendX + legendWidth, 0);
    gradient.addColorStop(0, 'rgb(0, 255, 0)');
    gradient.addColorStop(0.33, 'rgb(255, 255, 0)');
    gradient.addColorStop(0.66, 'rgb(255, 155, 0)');
    gradient.addColorStop(1, 'rgb(255, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = '11px sans-serif';
    ctx.fillText('Low', legendX, legendY + legendHeight + 13);
    ctx.fillText('High', legendX + legendWidth - 22, legendY + legendHeight + 13);
    
    setRendering(false);
  }

  useEffect(() => {
    drawHeatmap();
  }, [dataPoints, mapData]);

  function downloadImage() {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = 'light-pollution-map.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gray-900 min-h-screen">
      <div className="w-full max-w-5xl bg-gray-800 rounded-lg p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-4">Light Pollution Radar Map</h1>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Center Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={mapData.centerLat}
              onChange={(e) => setMapData({...mapData, centerLat: parseFloat(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Center Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={mapData.centerLng}
              onChange={(e) => setMapData({...mapData, centerLng: parseFloat(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Radius (km)</label>
            <input
              type="number"
              value={mapData.radiusKm}
              onChange={(e) => setMapData({...mapData, radiusKm: parseInt(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Image Size (px)</label>
            <input
              type="number"
              value={mapData.width}
              onChange={(e) => setMapData({...mapData, width: parseInt(e.target.value), height: parseInt(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Smoothness (20-200)</label>
            <input
              type="number"
              value={mapData.smoothness}
              onChange={(e) => setMapData({...mapData, smoothness: parseInt(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Threshold (0.05-0.5)</label>
            <input
              type="number"
              step="0.05"
              value={mapData.threshold}
              onChange={(e) => setMapData({...mapData, threshold: parseFloat(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Opacity (0.3-1.0)</label>
            <input
              type="number"
              step="0.1"
              min="0.3"
              max="1"
              value={mapData.opacity}
              onChange={(e) => setMapData({...mapData, opacity: parseFloat(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Random Points: {pointCount}</label>
            <input
              type="range"
              min="10"
              max="500"
              value={pointCount}
              onChange={(e) => setPointCount(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => generateRandomDataset(pointCount)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
            >
              Randomize Data Points
            </button>
          </div>
        </div>

        <button
          onClick={downloadImage}
          disabled={rendering}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded mb-4"
        >
          {rendering ? 'Rendering...' : 'Download PNG Image'}
        </button>

        <div className="bg-black rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={mapData.width}
            height={mapData.height}
            className="w-full h-auto"
          />
        </div>

        <div className="mt-4 text-sm text-gray-400 space-y-2">
          <p><strong>Smoothness:</strong> Higher = more fluid organic shapes (try 60-120)</p>
          <p><strong>Threshold:</strong> Minimum field strength to display (try 0.1-0.2)</p>
          <p><strong>Opacity:</strong> Transparency of heatmap overlay (0.6-0.8 works well)</p>
          <p>Map tiles from OpenStreetMap. Heatmap uses metaball field interpolation.</p>
        </div>
      </div>
    </div>
  );
}

export default LightPollutionMap;
