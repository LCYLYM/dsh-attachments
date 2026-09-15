import AppKit

// Browser owns drag targeting. This process owns no windows and reads only the drag pasteboard.
func emit(_ value: [String: Any]) {
    if let data = try? JSONSerialization.data(withJSONObject: value) {
        FileHandle.standardOutput.write(data + Data([10]))
    }
}
struct DragSnapshot {
    let id: String
    let path: String
    let changeCount: Int
    let expires: Date
}
let pasteboard = NSPasteboard(name: .drag)
var snapshot: DragSnapshot?
func cancel(_ id: String) {
    if snapshot?.id == id { snapshot = nil }
    emit(["id": id, "state": "cancelled"])
}
func directory() -> URL? {
    guard let urls = pasteboard.readObjects(forClasses: [NSURL.self], options: [.urlReadingFileURLsOnly: true]) as? [URL], urls.count == 1 else { return nil }
    var flag: ObjCBool = false
    guard FileManager.default.fileExists(atPath: urls[0].path, isDirectory: &flag), flag.boolValue else { return nil }
    return urls[0]
}
emit(["state": "ready", "protocol": 2])
while let line = readLine() {
    guard let data = line.data(using: .utf8), data.count < 4096,
          let command = (try? JSONSerialization.jsonObject(with: data)) as? [String: String],
          let id = command["id"] else { continue }
    autoreleasepool {
        switch command["op"] {
        case "arm":
            snapshot = nil
            let change = pasteboard.changeCount
            guard NSEvent.pressedMouseButtons & 1 != 0, let url = directory(), pasteboard.changeCount == change else { cancel(id); return }
            snapshot = DragSnapshot(id: id, path: url.path, changeCount: change, expires: Date().addingTimeInterval(16))
            emit(["id": id, "state": "armed"])
        case "resolve":
            guard let saved = snapshot, saved.id == id, saved.expires > Date(),
                  saved.changeCount == pasteboard.changeCount,
                  let name = command["name"], !name.isEmpty,
                  URL(fileURLWithPath: saved.path).lastPathComponent.precomposedStringWithCanonicalMapping == name.precomposedStringWithCanonicalMapping,
                  directory()?.path == saved.path else { cancel(id); return }
            snapshot = nil
            emit(["id": id, "state": "dropped", "path": saved.path])
        case "cancel": cancel(id)
        default: break
        }
    }
}
