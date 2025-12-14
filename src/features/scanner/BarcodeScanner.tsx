import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { X, Loader2 } from 'lucide-react'
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

                const scanner = new Html5Qrcode("reader")
                scannerRef.current = scanner

                await scanner.start(
                    { facingMode: "environment" }, // Prefer back camera
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                        formatsToSupport: [
                            Html5QrcodeSupportedFormats.EAN_13,
                            Html5QrcodeSupportedFormats.EAN_8,
                            Html5QrcodeSupportedFormats.UPC_A,
                            Html5QrcodeSupportedFormats.UPC_E,
                        ]
                    },
                    (decodedText) => {
                        // Success callback
                        if (mountedRef.current) {
                            onResult(decodedText)
                            // Stop scanning after success
                            scanner.stop().catch(err => console.warn("Failed to stop scanner after success", err))
                        }
                    },
                    (_errorMessage) => {
                        // Ignore scan errors as they happen every frame no code is detected
                    }
                )

                if (mountedRef.current) {
                    setInitializing(false)
                } else {
                    // If unmounted during start, clean up immediately
                    scanner.stop().catch(console.error).finally(() => scanner.clear())
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
            if (scannerRef.current) {
                if (scannerRef.current.isScanning) {
                    scannerRef.current.stop()
                        .catch(err => console.warn("Failed to stop scanner on unmount", err))
                        .finally(() => {
                            scannerRef.current?.clear().catch(err => console.warn("Failed to clear scanner", err))
                        })
                } else {
                    try {
                        scannerRef.current.clear()
                    } catch (e) {
                        // Ignore if clear fails (e.g. not started yet)
                    }
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

            <p className="text-white mt-4 text-center text-sm opacity-80">
                Point camera at a food barcode
            </p>
        </div>
    )
}
