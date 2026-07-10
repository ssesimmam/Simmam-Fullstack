const CERT_CONFIG = {
  templatePath: '/Simmam-Certificate.png',
  name: {
    xPct: 0.500,
    yPct: 0.465,
    fontSizePx: 84,
    fontFamily: 'Georgia, "Times New Roman", serif',
    color: '#1a1a1a',
    fontWeight: 'bold',
    maxWidthPct: 0.75,
  },
  event: {
    xPct: 0.500,
    yPct: 0.560,
    fontSizePx: 84,
    fontFamily: 'Georgia, "Times New Roman", serif',
    color: '#1a1a1a',
    fontWeight: 'bold',
    maxWidthPct: 0.70,
  },
}

export async function downloadCertificate(participantName: string, eventName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Could not get canvas context')

        const W = image.naturalWidth
        const H = image.naturalHeight
        canvas.width = W
        canvas.height = H

        // Draw template
        ctx.drawImage(image, 0, 0, W, H)

        // Draw Participant Name
        const nameCfg = CERT_CONFIG.name
        ctx.save()
        ctx.font = `${nameCfg.fontWeight} ${nameCfg.fontSizePx}px ${nameCfg.fontFamily}`
        ctx.fillStyle = nameCfg.color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        let fontSize = nameCfg.fontSizePx
        while (ctx.measureText(participantName).width > W * nameCfg.maxWidthPct && fontSize > 30) {
          fontSize -= 4
          ctx.font = `${nameCfg.fontWeight} ${fontSize}px ${nameCfg.fontFamily}`
        }
        ctx.fillText(participantName, W * nameCfg.xPct, H * nameCfg.yPct)
        ctx.restore()

        // Draw Event Name
        const eventCfg = CERT_CONFIG.event
        ctx.save()
        ctx.font = `${eventCfg.fontWeight} ${eventCfg.fontSizePx}px ${eventCfg.fontFamily}`
        ctx.fillStyle = eventCfg.color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        let eventFontSize = eventCfg.fontSizePx
        while (ctx.measureText(eventName).width > W * eventCfg.maxWidthPct && eventFontSize > 24) {
          eventFontSize -= 4
          ctx.font = `${eventCfg.fontWeight} ${eventFontSize}px ${eventCfg.fontFamily}`
        }
        ctx.fillText(eventName, W * eventCfg.xPct, H * eventCfg.yPct)
        ctx.restore()

        // Download using Blob to prevent mobile browser crashes with huge Data URIs
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'))
            return
          }
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = `${participantName.trim().replace(/\\s+/g, '_')}_Certificate.png`
          link.href = url
          link.click()
          
          // Cleanup
          setTimeout(() => URL.revokeObjectURL(url), 1000)
          resolve()
        }, 'image/png')
      } catch (err) {
        reject(err)
      }
    }

    image.onerror = () => {
      reject(new Error('Failed to load certificate template image'))
    }

    image.src = CERT_CONFIG.templatePath
  })
}
