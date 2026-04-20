export const rateLimitWarningTemplate = (tenantName: string, current: number, limit: number) => ({
  subject: `Rate Limit Warning - ${tenantName}`,
  body: `
    Hello!
    
    Your tenant ${tenantName} has reached 80% of the rate limit.
    Current usage: ${current}/${limit} requests per minute.
    
    Please optimize your API usage.
  `,
});