/**
 * Global teardown for Component tests
 * Runs after all tests complete
 */

import { logger, generateMarkdownFromJunit } from '@chauhaidang/xq-harness-common-kit';
import fs from 'fs';
import { writeFileSync } from 'node:fs';

export default async () => {
  try {
    logger.info('🧹 Integration Test-Teardown: Running global teardown');
    
    // Generate test report
    try {
      const xmlPath = './__tests__/integration/tsr/junit.xml';
      if (fs.existsSync(xmlPath)) {
        const xmlContent = fs.readFileSync(xmlPath, 'utf8');
        const markdown = await generateMarkdownFromJunit(xmlContent);
        writeFileSync('./__tests__/integration/tsr/report.md', markdown);
        logger.info('✅ Test report generated successfully');
      } else {
        logger.warn('⚠️ JUnit XML file not found, skipping report generation');
      }
    } catch (error) {
      logger.warn('⚠️ Could not generate test report:', error?.message || error);
    }
    
    logger.info('✅ Integration Test-Teardown: Global teardown complete');
  } catch (error) {
    // Ensure teardown never throws to prevent Jest from exiting with error
    logger.error('❌ Error in global teardown:', error?.message || error);
  }
};
