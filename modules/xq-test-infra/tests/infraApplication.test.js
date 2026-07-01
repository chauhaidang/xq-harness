const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const YAML = require('yaml')
const { createInfraApplication } = require('../src/app/infraApplication')

describe('InfraApplication', () => {
  let tempDir
  let specPath
  let composePath

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `xq-infra-app-${Date.now()}`)
    await fs.ensureDir(tempDir)

    specPath = path.join(tempDir, 'xq.yaml')
    composePath = path.join(tempDir, 'xq-compose.yml')
    await fs.writeFile(
      specPath,
      YAML.stringify({
        services: {
          api: {
            image: 'node',
            tag: '20-alpine',
            ports: ['3000:3000']
          }
        }
      }),
      'utf8'
    )
  })

  afterEach(async () => {
    await fs.remove(tempDir)
    await fs.remove(path.join(process.cwd(), 'xq-compose.yml'))
    await fs.remove(path.join(process.cwd(), 'nginx-gateway.conf'))
  })

  test('generate creates compose artifacts through the application interface', async () => {
    const app = createInfraApplication()

    const result = await app.generate({
      specPath,
      gateway: true,
      keepFile: true
    })

    expect(result.composePath).toBe(path.join(process.cwd(), 'xq-compose.yml'))
    expect(await fs.pathExists(result.composePath)).toBe(true)

    const compose = YAML.parse(await fs.readFile(result.composePath, 'utf8'))
    expect(compose.services.api.image).toBe('node:20-alpine')
    expect(compose.services).toHaveProperty('xq-gateway')
  })

  test('up starts compose services and waits for detected test containers', async () => {
    await fs.writeFile(
      composePath,
      YAML.stringify({
        services: {
          api: { image: 'node:20-alpine' },
          'api-test': { image: 'node:20-alpine' }
        }
      }),
      'utf8'
    )

    const calls = []
    const app = createInfraApplication({
      composeInvoker: {
        pull: async (file) => calls.push(['pull', file]),
        up: async (file, options) => calls.push(['up', file, options]),
        detectTestContainers: async (file, sourcePath) => {
          calls.push(['detectTestContainers', file, sourcePath])
          return ['api-test']
        },
        waitForTestContainers: async (file, containers) => {
          calls.push(['waitForTestContainers', file, containers])
          return true
        }
      }
    })

    const result = await app.up({
      composeFile: composePath,
      sourcePath: tempDir,
      pull: true
    })

    expect(result).toEqual({
      status: 'started',
      testContainers: ['api-test'],
      testsPassed: true
    })
    expect(calls).toEqual([
      ['pull', composePath],
      ['up', composePath, { pull: true }],
      ['detectTestContainers', composePath, tempDir],
      ['waitForTestContainers', composePath, ['api-test']]
    ])
  })

  test('up continues with local images when pulling images fails', async () => {
    const calls = []
    const app = createInfraApplication({
      composeInvoker: {
        pull: async () => {
          calls.push(['pull'])
          throw new Error('registry unavailable')
        },
        up: async (file, options) => calls.push(['up', file, options]),
        detectTestContainers: async () => [],
        waitForTestContainers: async () => {
          throw new Error('should not wait when no test containers exist')
        }
      }
    })

    const result = await app.up({
      composeFile: composePath,
      pull: true
    })

    expect(result).toEqual({
      status: 'started',
      testContainers: [],
      testsPassed: true,
      warnings: ['Failed to pull some images from registry. Proceeding with local/cached images. Reason: registry unavailable']
    })
    expect(calls).toEqual([
      ['pull'],
      ['up', composePath, { pull: true }]
    ])
  })

  test('up detects test containers from the default source directory when none is provided', async () => {
    const servicesDir = path.join(tempDir, 'services')
    await fs.ensureDir(servicesDir)

    const calls = []
    const app = createInfraApplication({
      composeInvoker: {
        pull: async () => calls.push(['pull']),
        up: async (file, options) => calls.push(['up', file, options]),
        detectTestContainers: async (file, sourcePath) => {
          calls.push(['detectTestContainers', file, sourcePath])
          return []
        },
        waitForTestContainers: async () => {
          throw new Error('should not wait when no test containers exist')
        }
      }
    })

    await app.up({
      composeFile: composePath,
      pull: false
    })

    expect(calls).toEqual([
      ['up', composePath, { pull: false }],
      ['detectTestContainers', composePath, servicesDir]
    ])
  })

  test('up reports a warning when test container detection fails', async () => {
    const app = createInfraApplication({
      composeInvoker: {
        pull: async () => {},
        up: async () => {},
        detectTestContainers: async () => {
          throw new Error('invalid compose output')
        },
        waitForTestContainers: async () => {
          throw new Error('should not wait when detection fails')
        }
      }
    })

    const result = await app.up({
      composeFile: composePath,
      pull: false
    })

    expect(result).toEqual({
      status: 'started',
      testContainers: [],
      testsPassed: true,
      warnings: ['Failed to detect test containers: invalid compose output']
    })
  })

  test('down stops compose services through the application interface', async () => {
    const calls = []
    const app = createInfraApplication({
      composeInvoker: {
        down: async (file) => calls.push(['down', file])
      }
    })

    const result = await app.down({ composeFile: composePath })

    expect(result).toEqual({ status: 'stopped' })
    expect(calls).toEqual([['down', composePath]])
  })

  test('logs streams compose logs through the application interface', async () => {
    const calls = []
    const app = createInfraApplication({
      composeInvoker: {
        logs: async (file, options) => calls.push(['logs', file, options])
      }
    })

    const result = await app.logs({
      composeFile: composePath,
      follow: true,
      tail: '50',
      timestamps: true,
      service: 'api'
    })

    expect(result).toEqual({ status: 'logs-streamed' })
    expect(calls).toEqual([
      [
        'logs',
        composePath,
        {
          follow: true,
          tail: '50',
          timestamps: true,
          service: 'api'
        }
      ]
    ])
  })
})
