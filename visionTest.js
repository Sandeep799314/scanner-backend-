import visionService from "./services/visionOAuthService.js"

const testVision = async () => {
  try {
    const text = await visionService("uploads/card.jpg") // kisi existing image ka path
    console.log("Detected Text:\n")
    console.log(text)
  } catch (error) {
    console.error("Error:", error.message)
  }
}

testVision()