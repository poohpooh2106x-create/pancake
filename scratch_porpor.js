const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const cust = await prisma.customer.upsert({
    where: { pancakeCustomerId: 'fb_porpor_1613' },
    update: {
      name: 'Porpor Prirapanpanit',
      primaryPhone: '0623929446',
      interestedVehicle: 'หางก้าง',
      leadSource: 'FB เคพีศรีราชา',
      receivedDate: '21/8/2026',
      receivedTime: '16:13',
      notes: 'ขอซื้อได้ไหม หางก้าง3เพลา 0623929446'
    },
    create: {
      pancakeCustomerId: 'fb_porpor_1613',
      name: 'Porpor Prirapanpanit',
      primaryPhone: '0623929446',
      interestedVehicle: 'หางก้าง',
      leadSource: 'FB เคพีศรีราชา',
      receivedDate: '21/8/2026',
      receivedTime: '16:13',
      notes: 'ขอซื้อได้ไหม หางก้าง3เพลา 0623929446',
      phones: {
        create: [
          {
            phoneNumber: '0623929446',
            rawExtracted: '0623929446',
            carrier: 'AIS',
            isPrimary: true
          }
        ]
      },
      messages: {
        create: [
          {
            conversationId: 'conv_porpor',
            senderType: 'CUSTOMER',
            text: 'ขอซื้อได้ไหม หางก้าง3เพลา 0623929446',
            extractedPhones: '["0623929446"]'
          }
        ]
      }
    }
  });
  console.log('INSERT_SUCCESS:', cust.name, cust.primaryPhone);
}

run().catch(console.error).finally(() => prisma.$disconnect());
