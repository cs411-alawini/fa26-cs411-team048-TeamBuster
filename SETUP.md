# Setup

## 1. Install Node.js

Download the **LTS** version from https://nodejs.org. Then restart VS Code.

## 2. Clone the repo

```bash
git clone https://github.com/cs411-alawini/fa26-cs411-team048-TeamBuster.git
```

Open the folder in VS Code.

## 3. Install packages and create your `.env`

In the VS Code terminal (**Ctrl+`**):

```bash
cd app
npm install
cp .env.example .env
```

Open `app/.env` and replace `change-me` with the database password from the team chat. Never commit `.env`.

## 4. Allow your IP in GCP

Google "what is my ip". Then go to **Cloud SQL → cs411-teambuster → Connections → Networking → Authorized networks → Add a network**, paste your IP, and click **Save**.

## 5. Run it

```bash
npm run dev
```

Open http://localhost:3000. The top-right should say **DB connected**.

## If it doesn't connect

| Error           | Fix                                                |
| --------------- | -------------------------------------------------- |
| `ETIMEDOUT`     | Your IP isn't allowed (step 4), or your IP changed |
| `Access denied` | Wrong password in `.env`                           |

After editing `.env`, stop the server (**Ctrl+C**) and run `npm run dev` again.

## AI rule

AI is OK for front-end code only. **No AI for any SQL.**
