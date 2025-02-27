const hyperlinks = require('./hyperlinks');
const mentions = require('./mentions');
const rp_analysis = require('./report-portal-analysis');
const rp_history = require('./report-portal-history');
const qc_test_summary = require('./quick-chart-test-summary');
const percy_analysis = require('./percy-analysis');
const custom = require('./custom');
const metadata = require('./metadata');
const { AIFailureSummaryExtension } = require('./ai-failure-summary.extension');
const { SmartAnalysisExtension } = require('./smart-analysis.extension');
const { CIInfoExtension } = require('./ci-info.extension');
const { EXTENSION } = require('../helpers/constants');
const { checkCondition } = require('../helpers/helper');
const logger = require('../utils/logger');

async function run(options) {
  const { target, result, hook } = options;
  const extensions = target.extensions || [];
  for (let i = 0; i < extensions.length; i++) {
    const extension = extensions[i];
    const extension_runner = getExtensionRunner(extension, options);
    const extension_options = Object.assign({}, extension_runner.default_options, extension);
    if (extension_options.hook === hook) {
      if (await checkCondition({ condition: extension_options.condition, result, target, extension })) {
        extension.outputs = {};
        options.extension = extension;
        try {
          await extension_runner.run(options);
        } catch (error) {
          logger.error(`Failed to run extension: ${error.message}`);
          logger.debug(`Extension details`, extension);
          logger.debug(`Error: `, error);
        }
      }
    }
  }
}

function getExtensionRunner(extension, options) {
  switch (extension.name) {
    case EXTENSION.HYPERLINKS:
      return hyperlinks;
    case EXTENSION.MENTIONS:
      return mentions;
    case EXTENSION.REPORT_PORTAL_ANALYSIS:
      return rp_analysis;
    case EXTENSION.REPORT_PORTAL_HISTORY:
      return rp_history;
    case EXTENSION.QUICK_CHART_TEST_SUMMARY:
      return qc_test_summary;
    case EXTENSION.PERCY_ANALYSIS:
      return percy_analysis;
    case EXTENSION.CUSTOM:
      return custom;
    case EXTENSION.METADATA:
      return metadata;
    case EXTENSION.CI_INFO:
      return new CIInfoExtension(options.target, extension, options.result, options.payload, options.root_payload);
    case EXTENSION.AI_FAILURE_SUMMARY:
      return new AIFailureSummaryExtension(options.target, extension, options.result, options.payload, options.root_payload);
    case EXTENSION.SMART_ANALYSIS:
      return new SmartAnalysisExtension(options.target, extension, options.result, options.payload, options.root_payload);
    default:
      return require(extension.name);
  }
}

module.exports = {
  run
}