import AppKit
import Foundation

struct AppIcon {
  let fileName: String
  let pixels: Int
  let idiom: String
  let size: String
  let scale: String
}

let icons: [AppIcon] = [
  AppIcon(fileName: "AppIcon-20@2x.png", pixels: 40, idiom: "iphone", size: "20x20", scale: "2x"),
  AppIcon(fileName: "AppIcon-20@3x.png", pixels: 60, idiom: "iphone", size: "20x20", scale: "3x"),
  AppIcon(fileName: "AppIcon-29@2x.png", pixels: 58, idiom: "iphone", size: "29x29", scale: "2x"),
  AppIcon(fileName: "AppIcon-29@3x.png", pixels: 87, idiom: "iphone", size: "29x29", scale: "3x"),
  AppIcon(fileName: "AppIcon-40@2x.png", pixels: 80, idiom: "iphone", size: "40x40", scale: "2x"),
  AppIcon(fileName: "AppIcon-40@3x.png", pixels: 120, idiom: "iphone", size: "40x40", scale: "3x"),
  AppIcon(fileName: "AppIcon-60@2x.png", pixels: 120, idiom: "iphone", size: "60x60", scale: "2x"),
  AppIcon(fileName: "AppIcon-60@3x.png", pixels: 180, idiom: "iphone", size: "60x60", scale: "3x"),
  AppIcon(fileName: "AppIcon-20-ipad@1x.png", pixels: 20, idiom: "ipad", size: "20x20", scale: "1x"),
  AppIcon(fileName: "AppIcon-20-ipad@2x.png", pixels: 40, idiom: "ipad", size: "20x20", scale: "2x"),
  AppIcon(fileName: "AppIcon-29-ipad@1x.png", pixels: 29, idiom: "ipad", size: "29x29", scale: "1x"),
  AppIcon(fileName: "AppIcon-29-ipad@2x.png", pixels: 58, idiom: "ipad", size: "29x29", scale: "2x"),
  AppIcon(fileName: "AppIcon-40-ipad@1x.png", pixels: 40, idiom: "ipad", size: "40x40", scale: "1x"),
  AppIcon(fileName: "AppIcon-40-ipad@2x.png", pixels: 80, idiom: "ipad", size: "40x40", scale: "2x"),
  AppIcon(fileName: "AppIcon-76@1x.png", pixels: 76, idiom: "ipad", size: "76x76", scale: "1x"),
  AppIcon(fileName: "AppIcon-76@2x.png", pixels: 152, idiom: "ipad", size: "76x76", scale: "2x"),
  AppIcon(fileName: "AppIcon-83.5@2x.png", pixels: 167, idiom: "ipad", size: "83.5x83.5", scale: "2x"),
  AppIcon(fileName: "AppIcon-1024.png", pixels: 1024, idiom: "ios-marketing", size: "1024x1024", scale: "1x"),
]

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let sourceURL = root.appendingPathComponent("public/icon-512.png")
let outputDirectory = root.appendingPathComponent("ios/App/App/Assets.xcassets/AppIcon.appiconset")
guard let sourceIcon = NSImage(contentsOf: sourceURL) else {
  fputs("Could not read source icon at \(sourceURL.path)\n", stderr)
  exit(1)
}

func renderIcon(pixelSize: Int) -> Data? {
  let colorSpace = CGColorSpaceCreateDeviceRGB()
  guard let context = CGContext(
    data: nil,
    width: pixelSize,
    height: pixelSize,
    bitsPerComponent: 8,
    bytesPerRow: pixelSize * 4,
    space: colorSpace,
    bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
  ) else {
    return nil
  }

  let canvasRect = CGRect(x: 0, y: 0, width: pixelSize, height: pixelSize)
  context.setFillColor(
    red: 247.0 / 255.0,
    green: 244.0 / 255.0,
    blue: 237.0 / 255.0,
    alpha: 1
  )
  context.fill(canvasRect)

  guard let sourceCgImage = sourceIcon.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    return nil
  }

  let inset = CGFloat(pixelSize) * 0.11
  let iconRect = CGRect(
    x: inset,
    y: inset,
    width: CGFloat(pixelSize) - inset * 2,
    height: CGFloat(pixelSize) - inset * 2
  )
  context.draw(sourceCgImage, in: iconRect)

  guard let renderedCgImage = context.makeImage() else {
    return nil
  }

  let bitmap = NSBitmapImageRep(cgImage: renderedCgImage)
  return bitmap.representation(using: .png, properties: [:])
}

for icon in icons {
  guard let pngData = renderIcon(pixelSize: icon.pixels) else {
    fputs("Could not render \(icon.fileName)\n", stderr)
    exit(1)
  }

  let outputURL = outputDirectory.appendingPathComponent(icon.fileName)
  do {
    try pngData.write(to: outputURL, options: .atomic)
    print("Wrote \(icon.fileName)")
  } catch {
    fputs("Could not write \(outputURL.path): \(error)\n", stderr)
    exit(1)
  }
}
