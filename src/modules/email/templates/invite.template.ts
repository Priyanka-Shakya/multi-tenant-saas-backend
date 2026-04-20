export const inviteTemplate = (tenantName: string, email: string) => ({
  subject: `You have been invited to ${tenantName}`,
  body: `
    Hello!
    
    You have been invited to join ${tenantName}.
    Your email: ${email}
    
    Welcome aboard!
  `,
});