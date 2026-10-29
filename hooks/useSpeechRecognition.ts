'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { toaster } from '@/lib/toaster'

/* eslint-disable @typescript-eslint/no-explicit-any -- the Web Speech API has no TS types */

const noopSubscribe = () => () => {}
const hasSpeechApi = () => {
  const w = window as any
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition)
}

/**
 * Spanish dictation with the Web Speech API. `onInterim` receives the text
 * while speaking; `onFinal` the full transcript when the user stops.
 */
export function useSpeechRecognition({
  onInterim,
  onFinal,
}: {
  onInterim: (text: string) => void
  onFinal: (text: string) => void
}) {
  // false on the server, the real value on the client (no hydration mismatch).
  const isSupported = useSyncExternalStore(noopSubscribe, hasSpeechApi, () => false)
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef('')
  // Latest callbacks without restarting the recognition on every render.
  const callbacks = useRef({ onInterim, onFinal })
  useEffect(() => {
    callbacks.current = { onInterim, onFinal }
  })

  useEffect(() => () => recognitionRef.current?.abort(), [])

  const toggle = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop()
      return
    }

    const w = window as any
    const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return

    transcriptRef.current = ''
    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'es-CO'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => setIsRecording(true)

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as unknown[])
        .map((r: any) => r[0].transcript as string)
        .join('')
      transcriptRef.current = transcript
      callbacks.current.onInterim(transcript)
    }

    recognition.onend = () => {
      setIsRecording(false)
      const finalText = transcriptRef.current.trim()
      transcriptRef.current = ''
      if (finalText) callbacks.current.onFinal(finalText)
    }

    recognition.onerror = (event: any) => {
      setIsRecording(false)
      transcriptRef.current = ''
      if (event.error === 'not-allowed') {
        toaster.create({
          title: 'Permiso denegado',
          description: 'Activa el micrófono en la configuración del navegador.',
          type: 'error',
          duration: 4000,
        })
      } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
        toaster.create({
          title: 'Error de micrófono',
          description: 'No se pudo capturar el audio. Intenta de nuevo.',
          type: 'error',
          duration: 3000,
        })
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [isRecording])

  return { isSupported, isRecording, toggle }
}
