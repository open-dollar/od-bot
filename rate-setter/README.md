# Rate Update Bot

Start the app with

```
yarn dev
```

Hit the endpoint `/api/rate?secret=<some-secret>` to trigger the bot to call `updateRate`


### Database

Update env

```
DATABASE_URL=postgres://me:password@0.0.0.0:5432/od-bots-testing
```

Run setup 

```bash
# Setup locally
npx prisma migrate dev
```

Go to production

```bash
npx prisma deploy
```