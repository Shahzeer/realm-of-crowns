const VALID_ROUTES: string[] = ["/", "/armies", "/diplomacy", "/events", "/ruler"];

export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  if (initial) {
    return "/";
  }
  if (VALID_ROUTES.includes(path) || path.startsWith("/province/")) {
    return path;
  }
  return "/";
}
