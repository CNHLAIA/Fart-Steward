// Skip signing script for development builds
exports.default = async function(configuration) {
  console.log('Skipping code signing for development build');
  return Promise.resolve();
};
