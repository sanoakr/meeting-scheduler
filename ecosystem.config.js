
module.exports = {
  apps: [{
    name: 'meeting-scheduler',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};

