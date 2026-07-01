const path = require('path')
const fs = require('fs-extra')
const composeGenerator = require('../services/composeGenerator')
const composeInvoker = require('../services/composeInvoker')

class InfraApplication {
  constructor(options = {}) {
    this.composeGenerator = options.composeGenerator || composeGenerator
    this.composeInvoker = options.composeInvoker || composeInvoker
  }

  async generate(command) {
    const specPath = path.resolve(process.cwd(), command.specPath)
    const composePath = await this.composeGenerator.generateCompose(specPath, {
      gateway: command.gateway,
      keepFile: command.keepFile,
      overrides: command.overrides
    })

    return { composePath }
  }

  async up(command = {}) {
    const composeFile = path.resolve(process.cwd(), command.composeFile || 'xq-compose.yml')
    const shouldPull = command.pull !== false
    const warnings = []

    if (shouldPull) {
      try {
        await this.composeInvoker.pull(composeFile)
      } catch (error) {
        warnings.push(
          `Failed to pull some images from registry. Proceeding with local/cached images. Reason: ${error.message || error}`
        )
      }
    }

    await this.composeInvoker.up(composeFile, { pull: shouldPull })

    const sourcePath = command.sourcePath
      ? path.resolve(process.cwd(), command.sourcePath)
      : await this.findDefaultSourcePath(composeFile)

    let testContainers = []
    try {
      testContainers = await this.composeInvoker.detectTestContainers(composeFile, sourcePath)
    } catch (error) {
      warnings.push(`Failed to detect test containers: ${error.message || error}`)
    }

    let testsPassed = true
    if (testContainers.length > 0) {
      testsPassed = await this.composeInvoker.waitForTestContainers(composeFile, testContainers)
    }

    const result = {
      status: 'started',
      testContainers,
      testsPassed
    }

    if (warnings.length > 0) {
      result.warnings = warnings
    }

    return result
  }

  async findDefaultSourcePath(composeFile) {
    const composeDir = path.dirname(composeFile)
    const candidates = [
      path.join(composeDir, 'test-env'),
      path.join(composeDir, 'services'),
      composeDir
    ]

    for (const candidate of candidates) {
      try {
        const stat = await fs.stat(candidate)
        if (stat.isDirectory()) {
          return candidate
        }
      } catch {
        // Try the next conventional source path.
      }
    }

    return undefined
  }

  async down(command = {}) {
    const composeFile = path.resolve(process.cwd(), command.composeFile || 'xq-compose.yml')
    await this.composeInvoker.down(composeFile)
    return { status: 'stopped' }
  }

  async logs(command = {}) {
    const composeFile = path.resolve(process.cwd(), command.composeFile || 'xq-compose.yml')
    await this.composeInvoker.logs(composeFile, {
      follow: !!command.follow,
      tail: command.tail || '100',
      timestamps: !!command.timestamps,
      service: command.service
    })
    return { status: 'logs-streamed' }
  }
}

function createInfraApplication(options) {
  return new InfraApplication(options)
}

module.exports = {
  InfraApplication,
  createInfraApplication
}
