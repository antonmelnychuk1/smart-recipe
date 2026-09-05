import AppKit
import Foundation

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let logoURL = root.appendingPathComponent("public/logo-full.png")
let outputDirectory = root.appendingPathComponent("ios/App/App/Assets.xcassets/Splash.imageset")
let outputFiles = [
  "splash-2732x2732-2.png",
  "splash-2732x2732-1.png",
  "splash-2732x2732.png",
]

let canvasSize = NSSize(width: 2732, height: 2732)
let cardSize = NSSize(width: 1140, height: 520)
let logoSize = NSSize(width: 820, height: 324)
let green = NSColor(
  calibratedRed: 2.0 / 255.0,
  green: 80.0 / 255.0,
  blue: 38.0 / 255.0,
  alpha: 1
)

guard let logo = NSImage(contentsOf: logoURL) else {
  fputs("Could not read logo at \(logoURL.path)\n", stderr)
  exit(1)
}

let image = NSImage(size: canvasSize)
image.lockFocus()

green.setFill()
NSRect(origin: .zero, size: canvasSize).fill()

let cardRect = NSRect(
  x: (canvasSize.width - cardSize.width) / 2,
  y: (canvasSize.height - cardSize.height) / 2,
  width: cardSize.width,
  height: cardSize.height
)
let cardPath = NSBezierPath(roundedRect: cardRect, xRadius: 96, yRadius: 96)
NSColor.white.setFill()
cardPath.fill()

let logoRect = NSRect(
  x: (canvasSize.width - logoSize.width) / 2,
  y: (canvasSize.height - logoSize.height) / 2,
  width: logoSize.width,
  height: logoSize.height
)
logo.draw(in: logoRect, from: .zero, operation: .sourceOver, fraction: 1)

image.unlockFocus()

guard
  let tiffData = image.tiffRepresentation,
  let bitmap = NSBitmapImageRep(data: tiffData),
  let pngData = bitmap.representation(using: .png, properties: [:])
else {
  fputs("Could not render splash PNG\n", stderr)
  exit(1)
}

for fileName in outputFiles {
  let outputURL = outputDirectory.appendingPathComponent(fileName)
  do {
    try pngData.write(to: outputURL, options: .atomic)
    print("Wrote \(outputURL.path)")
  } catch {
    fputs("Could not write \(outputURL.path): \(error)\n", stderr)
    exit(1)
  }
}
