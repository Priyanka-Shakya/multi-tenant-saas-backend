export const apiKeyRotateTemplate = (tenantName: string) => ({
  subject: `API Key Rotated - ${tenantName}`,
  body: `
    Hello!
    
    Your API key for ${tenantName} has been rotated.
    Old key will expire in 15 minutes.
    
    Please update your applications with the new key.
  `,
});