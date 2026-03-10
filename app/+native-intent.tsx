const VALID_ROUTES: string[] = ["/", "/armies", "/diplomacy", "/events", "/ruler"];

export function redirectSystemPath({
  path: _path,
  initial: _initial,
}: {
  path: string;
  initial: boolean;
}) {
  if (_initial) {
    return "/";
  }
  if (VALID_ROUTES.includes(_path) || _path.startsWith("/province/")) {
    return _path;
  }
  return "/";
}
