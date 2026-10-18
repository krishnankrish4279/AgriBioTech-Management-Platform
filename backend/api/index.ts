import app from '../src/server';

// Serverless handler for Vercel
const handler = (req: any, res: any) => {
  return app(req, res);
};

export default handler;

// CommonJS compatibility for Vercel Serverless Function runner
if (typeof module !== 'undefined' && module.exports) {
  module.exports = handler;
  // @ts-ignore
  module.exports.default = handler;
}
