import { useState, useRef, useEffect } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import CameraIcon from '@mui/icons-material/Camera'
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid'
import WineBarIcon from '@mui/icons-material/WineBar'
import LocalBarIcon from '@mui/icons-material/LocalBar'
import SportsBarIcon from '@mui/icons-material/SportsBar'
import { motion } from 'framer-motion'

function BeverageDetection({ user, onBack }) {
  const [cameraActive, setCameraActive] = useState(false)
  const [facingMode, setFacingMode] = useState('environment') // back camera
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)

  const startCamera = async () => {
    try {
      setError('')
      
      // Request camera with constraints
      const constraints = {
        video: { 
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      }
      
      console.log('[BeverageDetection] Requesting camera with constraints:', constraints)
      console.log('[BeverageDetection] videoRef.current:', videoRef.current)
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      console.log('[BeverageDetection] Got stream:', stream)
      console.log('[BeverageDetection] Video tracks:', stream.getVideoTracks())
      console.log('[BeverageDetection] Track settings:', stream.getVideoTracks()[0]?.getSettings())
      
      if (videoRef.current) {
        console.log('[BeverageDetection] Setting srcObject on video element')
        videoRef.current.srcObject = stream
        streamRef.current = stream
        
        // Log video element state
        console.log('[BeverageDetection] Video element readyState:', videoRef.current.readyState)
        console.log('[BeverageDetection] Video element paused:', videoRef.current.paused)
        
        // For iOS Safari - must explicitly play
        try {
          await videoRef.current.play()
          console.log('[BeverageDetection] Video playing successfully')
          console.log('[BeverageDetection] Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight)
        } catch (playErr) {
          console.log('[BeverageDetection] Autoplay blocked:', playErr)
        }
        
        console.log('[BeverageDetection] Setting cameraActive to true')
        setCameraActive(true)
      } else {
        console.log('[BeverageDetection] ERROR: videoRef.current is null!')
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.')
      console.error('[BeverageDetection] Camera error:', err)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  const flipCamera = async () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newFacingMode)
    
    if (cameraActive) {
      stopCamera()
      // Small delay to ensure cleanup before restarting
      setTimeout(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: { ideal: newFacingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: false
          })
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            streamRef.current = stream
            try {
              await videoRef.current.play()
            } catch (e) {
              console.log('Play error:', e)
            }
            setCameraActive(true)
          }
        } catch (err) {
          setError('Unable to switch camera.')
        }
      }, 100)
    }
  }

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return
    
    setLoading(true)
    setError('')
    
    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0)
      
      // Convert to blob
      canvas.toBlob(async (blob) => {
        try {
          await analyzeImage(blob)
        } catch (err) {
          setError('Failed to analyze image. Please try again.')
          console.error('Analysis error:', err)
        }
        setLoading(false)
      }, 'image/jpeg', 0.8)
      
    } catch (err) {
      setError('Failed to capture image')
      setLoading(false)
    }
  }

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const analyzeImage = async (imageBlob) => {
    const base64 = await blobToBase64(imageBlob)
    const base64Data = base64.split(',')[1] // Remove data:image/jpeg;base64, prefix
    
    const prompt = `
Analyze this beverage label image and provide detailed information.

Identify:
- Beverage name and brand
- Type (wine/beer/spirits) and style
- Region/origin
- Grape varieties or ingredients
- Vintage year if visible
- Alcohol content if visible

Provide:
- Detailed flavor profile and tasting notes
- Food pairing recommendations (at least 4 suggestions)
- Serving temperature
- Brief background about the producer
- Approximate price range

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "name": "beverage name",
  "type": "category and style",
  "region": "origin location",
  "grapes": ["grape1", "grape2"],
  "vintage": "year or N/A",
  "alcohol": "percentage",
  "flavorProfile": "detailed description",
  "foodPairing": ["food1", "food2", "food3", "food4"],
  "servingTemp": "temperature range",
  "background": "producer info",
  "priceRange": "$X-Y",
  "confidence": 0.85
}

If you cannot identify a beverage in the image, return:
{
  "error": "No beverage label detected",
  "suggestion": "Please point the camera at a wine, beer, or spirits bottle label"
}
`

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      
      if (!apiKey) {
        setError('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to .env')
        return
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1500
          }
        })
      })

      const data = await response.json()
      
      console.log('Gemini response:', data)
      
      if (data.error) {
        setError(`API Error: ${data.error.message}`)
        return
      }
      
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const resultText = data.candidates[0].content.parts[0].text
        console.log('Result text:', resultText)
        
        // Try to parse JSON from the response
        try {
          // Clean up the response - remove markdown code blocks if present
          let cleanedText = resultText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim()
          
          const parsedResult = JSON.parse(cleanedText)
          
          if (parsedResult.error) {
            setError(parsedResult.suggestion || parsedResult.error)
          } else {
            setResult(parsedResult)
          }
        } catch (parseErr) {
          console.error('JSON parse error:', parseErr)
          // Fallback: show raw text
          setResult({
            name: 'Analysis Result',
            type: 'Unknown',
            region: 'Unknown',
            grapes: [],
            flavorProfile: resultText,
            foodPairing: [],
            servingTemp: 'N/A',
            confidence: 0.5
          })
        }
      } else {
        setError('Could not analyze the beverage. Please try again with a clearer image.')
      }
    } catch (err) {
      console.error('Gemini API error:', err)
      setError('Analysis failed. Please check your connection and try again.')
    }
  }

  const getBeverageIcon = (type) => {
    if (!type) return <LocalBarIcon sx={{ fontSize: 40 }} />
    const typeLower = type.toLowerCase()
    if (typeLower.includes('wine')) return <WineBarIcon sx={{ fontSize: 40 }} />
    if (typeLower.includes('beer')) return <SportsBarIcon sx={{ fontSize: 40 }} />
    return <LocalBarIcon sx={{ fontSize: 40 }} />
  }

  // Debug: Log when video events fire
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      console.log('[BeverageDetection] Video loadedmetadata event')
      console.log('[BeverageDetection] Video size:', video.videoWidth, 'x', video.videoHeight)
    }
    
    const handleLoadedData = () => {
      console.log('[BeverageDetection] Video loadeddata event')
    }
    
    const handleCanPlay = () => {
      console.log('[BeverageDetection] Video canplay event')
    }
    
    const handlePlaying = () => {
      console.log('[BeverageDetection] Video playing event')
    }
    
    const handleError = (e) => {
      console.error('[BeverageDetection] Video error event:', e)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('playing', handlePlaying)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('error', handleError)
    }
  }, [])

  useEffect(() => {
    return () => {
      stopCamera() // Cleanup on unmount
    }
  }, [])

  return (
    <motion.div 
      className="min-h-screen bg-gray-900 pb-safe"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-4 shadow-lg pt-safe">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              stopCamera()
              onBack()
            }}
            className="w-10 h-10 flex items-center justify-center rounded-xl 
                     bg-white/20 hover:bg-white/30 transition-all duration-200"
          >
            <ArrowBackIcon />
          </button>
          <div className="flex items-center gap-2">
            <WineBarIcon />
            <h1 className="text-xl font-bold">Beverage Detection</h1>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Debug info */}
        <div className="bg-gray-800 text-xs text-gray-400 p-2 rounded font-mono">
          cameraActive: {cameraActive ? 'true' : 'false'} | 
          result: {result ? 'yes' : 'no'} | 
          loading: {loading ? 'true' : 'false'} |
          videoRef: {videoRef.current ? 'exists' : 'null'}
        </div>

        {error && (
          <motion.div 
            className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {!cameraActive && !result ? (
          // Camera Start Screen
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-center gap-4 mb-6">
              <WineBarIcon sx={{ fontSize: 48 }} className="text-red-400" />
              <SportsBarIcon sx={{ fontSize: 48 }} className="text-yellow-400" />
              <LocalBarIcon sx={{ fontSize: 48 }} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Scan Beverage Label</h2>
            <p className="text-gray-400 mb-6 max-w-xs mx-auto">
              Point your camera at any wine, beer, or spirits label to get detailed information, tasting notes, and food pairings
            </p>
            <button
              onClick={startCamera}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 
                       text-white px-8 py-3 rounded-xl font-medium transition-all active:scale-95"
            >
              Start Camera
            </button>
          </motion.div>
        ) : null}
        
        {/* Video element - always in DOM but hidden when not active */}
        <div className={`space-y-4 ${!cameraActive || result ? 'hidden' : ''}`}>
          {/* Video Stream */}
          <div className="relative bg-black rounded-xl overflow-hidden" style={{ minHeight: '400px' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              webkit-playsinline="true"
              style={{ 
                width: '100%', 
                height: '400px', 
                  objectFit: 'cover',
                  backgroundColor: '#000'
                }}
              />
              
              {/* Camera Controls Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Viewfinder */}
                <div className="absolute inset-8 border-2 border-white/30 rounded-lg">
                  <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-purple-400"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-purple-400"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-purple-400"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-purple-400"></div>
                </div>
                
                {/* Instructions */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                              bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                  {loading ? 'Analyzing...' : 'Center the bottle label'}
                </div>
              </div>

              {/* Loading Overlay */}
              {loading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-400/30 border-t-purple-400 
                                  rounded-full animate-spin mb-3" />
                    <p className="text-white font-medium">Analyzing beverage...</p>
                    <p className="text-gray-400 text-sm">This may take a moment</p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center items-center gap-6">
              <button
                onClick={flipCamera}
                disabled={loading}
                className="w-12 h-12 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-full 
                         flex items-center justify-center text-white transition-colors"
              >
                <FlipCameraAndroidIcon />
              </button>
              
              <button
                onClick={captureImage}
                disabled={loading}
                className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 
                         hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 
                         rounded-full flex items-center justify-center text-white 
                         transition-all active:scale-95 shadow-lg shadow-purple-500/30"
              >
                {loading ? (
                  <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CameraIcon sx={{ fontSize: 32 }} />
                )}
              </button>
              
              <button
                onClick={stopCamera}
                disabled={loading}
                className="w-12 h-12 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-full 
                         flex items-center justify-center text-white transition-colors text-xl"
              >
                ✕
              </button>
            </div>
          </div>

        {/* Results */}
        {result && (
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header Card */}
            <div className="bg-gradient-to-br from-purple-900/80 to-pink-900/80 rounded-xl p-5 border border-purple-500/30">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center text-purple-300">
                  {getBeverageIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white leading-tight">{result.name}</h3>
                  <p className="text-purple-300 text-sm mt-1">{result.type}</p>
                  {result.region && (
                    <p className="text-gray-400 text-sm">{result.region}</p>
                  )}
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
                {result.vintage && result.vintage !== 'N/A' && (
                  <div className="text-center">
                    <p className="text-purple-300 text-xs uppercase">Vintage</p>
                    <p className="text-white font-semibold">{result.vintage}</p>
                  </div>
                )}
                {result.alcohol && (
                  <div className="text-center">
                    <p className="text-purple-300 text-xs uppercase">ABV</p>
                    <p className="text-white font-semibold">{result.alcohol}</p>
                  </div>
                )}
                {result.priceRange && (
                  <div className="text-center">
                    <p className="text-purple-300 text-xs uppercase">Price</p>
                    <p className="text-white font-semibold">{result.priceRange}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Grapes/Ingredients */}
            {result.grapes && result.grapes.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-4">
                <h4 className="font-semibold text-purple-400 mb-2">Grape Varieties</h4>
                <div className="flex flex-wrap gap-2">
                  {result.grapes.map((grape, index) => (
                    <span 
                      key={index}
                      className="bg-purple-900/50 text-purple-200 px-3 py-1 rounded-full text-sm"
                    >
                      {grape}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Flavor Profile */}
            {result.flavorProfile && (
              <div className="bg-gray-800 rounded-xl p-4">
                <h4 className="font-semibold text-purple-400 mb-2">Tasting Notes</h4>
                <p className="text-gray-300 leading-relaxed">{result.flavorProfile}</p>
              </div>
            )}

            {/* Food Pairing */}
            {result.foodPairing && result.foodPairing.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-4">
                <h4 className="font-semibold text-purple-400 mb-3">Food Pairings</h4>
                <div className="grid grid-cols-2 gap-2">
                  {result.foodPairing.map((food, index) => (
                    <div 
                      key={index}
                      className="bg-gray-700/50 text-gray-300 px-3 py-2 rounded-lg text-sm flex items-center gap-2"
                    >
                      <span className="text-purple-400">•</span>
                      {food}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Serving & Background */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.servingTemp && result.servingTemp !== 'N/A' && (
                <div className="bg-gray-800 rounded-xl p-4">
                  <h4 className="font-semibold text-purple-400 mb-2">Serving Temperature</h4>
                  <p className="text-gray-300">{result.servingTemp}</p>
                </div>
              )}
              
              {result.background && (
                <div className="bg-gray-800 rounded-xl p-4">
                  <h4 className="font-semibold text-purple-400 mb-2">About</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{result.background}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setResult(null)
                  startCamera()
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 
                         hover:from-purple-500 hover:to-pink-500 text-white py-3 
                         rounded-xl font-medium transition-all active:scale-[0.98]"
              >
                Scan Another
              </button>
              <button
                onClick={() => setResult(null)}
                className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-3 
                         rounded-xl font-medium transition-colors"
              >
                Done
              </button>
            </div>

            {/* Confidence indicator */}
            {result.confidence && (
              <p className="text-center text-xs text-gray-500">
                AI Confidence: {(result.confidence * 100).toFixed(0)}%
              </p>
            )}
          </motion.div>
        )}
      </div>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  )
}

export default BeverageDetection
