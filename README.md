# Pokemon GO Grunt Battle Simulator

Static Next.js app that simulates best counters for Team GO Rocket grunt types using fast move DPS, STAB, shadow bonus, and type effectiveness logic ported from `grunt-rockets`.

## Local Development

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## GitHub Pages Hosting

This project is configured for static export (`output: "export"`) and includes a Pages workflow at `.github/workflows/deploy-pages.yml`.

### One-time repository setup

1. Push this project to a GitHub repository.
2. In GitHub, open **Settings -> Pages**.
3. Set **Source** to **GitHub Actions**.

### Deploy

- Push to the `main` branch.
- GitHub Actions builds the site and deploys the `out` directory to Pages.

The app automatically sets `basePath`/`assetPrefix` from `GITHUB_REPOSITORY` during CI, so it works under `https://<user>.github.io/<repo>/`.
