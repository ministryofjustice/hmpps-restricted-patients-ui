import express, { Express } from 'express'
import request from 'supertest'
import journeyStartRouter, { isLocalPath } from './journeyStartRouter'

let session: Record<string, unknown>
let app: Express

beforeEach(() => {
  session = {}
  app = express()
  app.use((req, _res, next) => {
    // @ts-expect-error minimal session for the test
    req.session = session
    next()
  })
  app.use(journeyStartRouter())
  app.get('/some-page', (_req, res) => {
    res.send('ok')
  })
})

describe('isLocalPath', () => {
  it.each(['/', '/move-to-hospital/select-prisoner?searchTerm=Smith'])('accepts %s', url => {
    expect(isLocalPath(url)).toBe(true)
  })

  it.each(['https://example.com', '//example.com', '/\\example.com', 'example.com', '', undefined, ['/a', '/b']])(
    'rejects %s',
    url => {
      expect(isLocalPath(url)).toBe(false)
    },
  )
})

describe('journey start', () => {
  it('remembers a path on this site and returns to it', async () => {
    await request(app).get('/some-page?journeyStartUrl=/view-restricted-patients').expect(200)
    expect(session.journeyStartUrl).toEqual('/view-restricted-patients')

    await request(app).get('/back-to-start').expect(302).expect('Location', '/view-restricted-patients')
    expect(session.journeyStartUrl).toBeUndefined()
  })

  it.each(['https://example.com', '//example.com', '/\\example.com'])('ignores %s', async url => {
    await request(app)
      .get(`/some-page?journeyStartUrl=${encodeURIComponent(url)}`)
      .expect(200)
    expect(session.journeyStartUrl).toBeUndefined()

    await request(app).get('/back-to-start').expect(302).expect('Location', '/')
  })

  it('does not redirect off the site if the session already holds another address', async () => {
    session.journeyStartUrl = 'https://example.com'

    await request(app).get('/back-to-start').expect(302).expect('Location', '/')
  })

  it('returns to the home page when no journey has started', async () => {
    await request(app).get('/back-to-start').expect(302).expect('Location', '/')
  })
})
