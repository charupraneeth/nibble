import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Loader2, Upload } from 'lucide-react'
import { Card } from '@/components/ui/card'
import Quagga from '@ericblade/quagga2'

interface BarcodeScannerProps {
    onResult: (result: string) => void
    onCancel: () => void
}

export function BarcodeScanner({ onResult, onCancel }: BarcodeScannerProps) {
    const [error, setError] = useState<string | null>(null)
    const [initializing, setInitializing] = useState(true)
    const scannerRef = useRef<HTMLDivElement>(null)
    const mountedRef = useRef(true)

    useEffect(() => {
        mountedRef.current = true

        const initScanner = async () => {
            try {
                await Quagga.init({
                    inputStream: {
                        type: 'LiveStream',
                        target: scannerRef.current!,
                        constraints: {
                            facingMode: 'environment',
                            width: { ideal: 1280 },
                            height: { ideal: 720 }
                        }
                    },
                    decoder: {
                        readers: [
                            'ean_reader',
                            'ean_8_reader',
                            'upc_reader',
                            'upc_e_reader',
                            'code_128_reader',
                            'code_39_reader'
                        ]
                    },
                    locate: true
                }, (err) => {
                    if (err) {
                        console.error('Quagga init error:', err)
                        setError('Failed to start camera')
                        setInitializing(false)
                        return
                    }

                    if (!mountedRef.current) {
                        Quagga.stop()
                        return
                    }

                    setInitializing(false)
                    Quagga.start()
                })

                // Set up detection handler
                Quagga.onDetected((result) => {
                    if (result.codeResult && result.codeResult.code) {
                        const code = result.codeResult.code
                        // Stop scanner before calling callback
                        Quagga.stop()
                        if (mountedRef.current) {
                            onResult(code)
                        }
                    }
                })

            } catch (err) {
                console.error('Scanner init failed', err)
                setError('Camera access denied or not supported')
                setInitializing(false)
            }
        }

        initScanner()

        return () => {
            mountedRef.current = false
            Quagga.stop()
            Quagga.offDetected()
        }
    }, [onResult])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setInitializing(true)
        setError(null)

        try {
            // Create image URL for Quagga
            const imageUrl = URL.createObjectURL(file)

            Quagga.decodeSingle({
                src: imageUrl,
                numOfWorkers: 0,
                decoder: {
                    readers: [
                        'ean_reader',
                        'ean_8_reader',
                        'upc_reader',
                        'upc_e_reader',
                        'code_128_reader',
                        'code_39_reader'
                    ]
                },
                locate: true
            }, (result) => {
                URL.revokeObjectURL(imageUrl)
                setInitializing(false)

                if (result && result.codeResult && result.codeResult.code) {
                    onResult(result.codeResult.code)
                } else {
                    setError('No barcode found in image. Try a clearer photo.')
                }
            })
        } catch (err) {
            console.error('File scan failed', err)
            setError('Failed to scan image')
            setInitializing(false)
        }
    }

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

            <Card className="w-full max-w-md overflow-hidden bg-black border-white/20 relative">
                <div className="relative w-full h-[400px] bg-black flex items-center justify-center">
                    <div
                        ref={scannerRef}
                        className="w-full h-full"
                    />

                    {initializing && !error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
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

                <label className="cursor-pointer inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm transition-colors">
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                    <Upload className="h-4 w-4" />
                    Upload Image
                </label>
            </div>
        </div>
    )
}
