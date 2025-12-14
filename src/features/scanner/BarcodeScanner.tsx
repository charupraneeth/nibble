import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { X, Loader2, Upload } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface BarcodeScannerProps {
    onResult: (result: string) => void
    onCancel: () => void
}

export function BarcodeScanner({ onResult, onCancel }: BarcodeScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [initializing, setInitializing] = useState(true)
    const mountedRef = useRef(true)

    const videoRef = useRef<HTMLVideoElement | null>(null)

    useEffect(() => {
        mountedRef.current = true
        // Initialize scanner
        const initializeScanner = async () => {
            try {
                // Use back camera by default
                const devices = await Html5Qrcode.getCameras()
                if (!mountedRef.current) return

                if (!devices || devices.length === 0) {
                    throw new Error('No camera found')
                }

                // If reader element is not in DOM yet or removed, stop
                if (!document.getElementById("reader")) {
                    console.warn("Scanner container not found in DOM")
                    return
                }

                const scanner = new Html5Qrcode("reader", {
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.EAN_8,
                        Html5QrcodeSupportedFormats.UPC_A,
                        Html5QrcodeSupportedFormats.UPC_E,
                    ],
                    verbose: false
                })
                scannerRef.current = scanner

                await scanner.start(
                    { facingMode: "environment" }, // Prefer back camera
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    async (decodedText) => {
                        // Success callback
                        if (mountedRef.current) {
                            // Stop scanning immediately upon success to ensure camera is off
                            try {
                                await scanner.stop()
                                scanner.clear()
                            } catch (err) {
                                console.warn("Failed to clean stop scanner", err)
                            }

                            // Only after stopping, trigger the result
                            if (mountedRef.current) {
                                onResult(decodedText)
                            }
                        }
                    },
                    (_errorMessage) => {
                        // Ignore scan errors as they happen every frame no code is detected
                    }
                )

                // Capture video element reference immediately after start
                const videoElement = document.querySelector('#reader video') as HTMLVideoElement
                if (videoElement) {
                    videoRef.current = videoElement
                }

                if (mountedRef.current) {
                    setInitializing(false)
                } else {
                    // If unmounted during start, clean up immediately
                    scanner.stop().catch(console.error).finally(() => {
                        try {
                            scanner.clear()
                        } catch (e: unknown) {
                            console.warn("Failed to clear scanner", e)
                        }
                    })
                }
            } catch (err) {
                console.error("Scanner initialization failed", err)
                if (mountedRef.current) {
                    setError(err instanceof Error ? err.message : 'Failed to start camera')
                    setInitializing(false)
                }
            }
        }

        initializeScanner()

        return () => {
            mountedRef.current = false

            // 1. Force hardware off immediately (Priority)
            const cleanupMediaStream = () => {
                let video = videoRef.current
                if (!video) {
                    video = document.querySelector('#reader video') as HTMLVideoElement
                }

                if (video) {
                    // Prevent noisy "onabort" errors from library when we force stop
                    video.onabort = null

                    if (video.srcObject) {
                        const stream = video.srcObject as MediaStream
                        const tracks = stream.getTracks()
                        tracks.forEach(track => track.stop())
                        video.srcObject = null
                    }
                }
            }
            cleanupMediaStream()

            // 2. Tell library to clean up (Cleanup)
            if (scannerRef.current) {
                try {
                    // Check internal state if possible, or just catch the error
                    // The library throws "scanner is not running" if we call stop() when it's not scanning
                    // We can check isScanning (if available on the instance type) 
                    // or just wrap in try/catch and ignore that specific error.

                    if (scannerRef.current.isScanning) {
                        scannerRef.current.stop().catch((err) => {
                            console.warn("Scanner stop error:", err)
                        }).finally(() => {
                            scannerRef.current?.clear()
                        })
                    } else {
                        // Just clear if not scanning
                        scannerRef.current.clear()
                    }
                } catch (err) {
                    console.warn("Scanner cleanup error:", err)
                }
            }
        }
    }, [onResult])

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={onCancel}
            >
                <X className="h-6 w-6" />
            </Button>

            <Card className="w-full max-w-md overflow-hidden bg-black border-white/20">
                <div className="relative w-full h-[400px] bg-black">
                    <div id="reader" className="w-full h-full" />
                    {initializing && !error && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                    )}
                </div>
            </Card>

            {error && (
                <div className="mt-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-md">
                    {error}
                </div>
            )}

            <div className="text-center mt-4">
                <p className="text-white text-sm opacity-80 mb-2">
                    Point camera at a food barcode
                </p>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-black px-2 text-white/60">Or</span>
                    </div>
                </div>
                <label className="cursor-pointer inline-flex items-center gap-2 mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm transition-colors">
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return

                            // Scan file
                            try {
                                setInitializing(true)
                                setError(null)

                                // 1. Clean up existing scanner if any (to reset config)
                                if (scannerRef.current) {
                                    try {
                                        if (scannerRef.current.isScanning) {
                                            await scannerRef.current.stop()
                                        }
                                        scannerRef.current.clear()
                                    } catch (e) {
                                        console.warn("Pre-file scan cleanup warning:", e)
                                    }
                                    scannerRef.current = null
                                }

                                // 2. Create NEW instance with permissive config + Native API support
                                const config = {
                                    experimentalFeatures: {
                                        useBarCodeDetectorIfSupported: true
                                    },
                                    verbose: false
                                }

                                scannerRef.current = new Html5Qrcode("reader", config)

                                const result = await scannerRef.current.scanFileV2(file, true)
                                if (result && result.decodedText) {
                                    onResult(result.decodedText)
                                }
                            } catch (err) {
                                console.error("File scan failed", err)
                                const msg = err instanceof Error ? err.message : String(err)

                                if (msg.includes("NotFoundException") || msg.includes("No MultiFormat Readers")) {
                                    setError("No barcode found. Try a clearer image or different angle.")
                                } else {
                                    setError("Could not read barcode from image")
                                }
                            } finally {
                                setInitializing(false)
                            }
                        }}
                    />
                    <Upload className="h-4 w-4" />
                    Upload Image
                </label>
            </div>
        </div>
    )
}
