{ pkgs, ... }:

{
  # Core tools available in the shell
  packages = with pkgs; [
    git
    nodejs_22
    nodePackages.npm
    pnpm
    nodePackages.dotenv-cli
  ];

  # JavaScript/Node language support
  languages.javascript.enable = true;
  languages.javascript.package = pkgs.nodejs_22;

  # Load variables from .env files if present
  dotenv.enable = true;

  # Print versions on shell entry (useful sanity check)
  enterShell = ''
    echo "node: $(node -v)"
    echo "npm:  $(npm -v)"
    command -v pnpm >/dev/null 2>&1 && echo "pnpm: $(pnpm -v)" || true
  '';

  # Convenient tasks: list with `devenv tasks list`, run with `devenv tasks run <name>`
  tasks = {
    "app:install".exec = ''
      if command -v pnpm >/dev/null 2>&1; then
        pnpm install || pnpm i
      else
        npm ci || npm install
      fi
    '';

    "app:dev".exec = ''
      if command -v pnpm >/dev/null 2>&1; then
        pnpm dev
      else
        npm run dev
      fi
    '';

    "app:build".exec = ''
      if command -v pnpm >/dev/null 2>&1; then
        pnpm build
      else
        npm run build
      fi
    '';

    "app:preview".exec = ''
      if command -v pnpm >/dev/null 2>&1; then
        pnpm preview
      else
        npm run preview
      fi
    '';

    "app:typecheck".exec = ''
      if command -v pnpm >/dev/null 2>&1; then
        pnpm typecheck
      else
        npm run typecheck
      fi
    '';

    "app:lint".exec = ''
      if command -v pnpm >/dev/null 2>&1; then
        pnpm lint
      else
        npm run lint
      fi
    '';

    "app:format".exec = ''
      if command -v pnpm >/dev/null 2>&1; then
        pnpm format
      else
        npm run format
      fi
    '';
  };
}
