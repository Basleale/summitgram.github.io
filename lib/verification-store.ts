// Simple in-memory store for verification codes
// In production, use Redis or a database
interface VerificationData {
  code: string
  name: string
  timestamp: number
}

class VerificationStore {
  private store = new Map<string, VerificationData>()

  set(email: string, data: VerificationData) {
    this.store.set(email, data)

    // Auto-cleanup after 10 minutes
    setTimeout(
      () => {
        this.store.delete(email)
      },
      10 * 60 * 1000,
    )
  }

  get(email: string): VerificationData | undefined {
    return this.store.get(email)
  }

  delete(email: string): boolean {
    return this.store.delete(email)
  }

  // Clean up expired codes
  cleanup() {
    const now = Date.now()
    for (const [email, data] of this.store.entries()) {
      if (now - data.timestamp > 10 * 60 * 1000) {
        this.store.delete(email)
      }
    }
  }
}

export const verificationStore = new VerificationStore()

// Run cleanup every 5 minutes
setInterval(
  () => {
    verificationStore.cleanup()
  },
  5 * 60 * 1000,
)
