import { Router, Request, Response } from 'express';
import { CustomerService } from '../services/customer.service';
import { GoogleSheetsService } from '../services/google-sheets.service';
import { PancakeApiService } from '../services/pancake-api.service';
import { VEHICLE_PRESETS, SALES_TEAM, LEAD_SOURCES } from '../utils/vehicle-extractor.util';
import { prisma } from '../db/prisma';

const router = Router();

// GET /api/customers/meta - Return metadata options (sales team, vehicle presets, lead sources)
router.get('/meta', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      salesTeam: SALES_TEAM,
      vehicles: VEHICLE_PRESETS,
      leadSources: LEAD_SOURCES,
    },
  });
});

// GET /api/customers - List customers with filtering and pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = req.query.search as string;
    const hasPhone = req.query.has_phone === 'true';
    const platform = req.query.platform as string;
    const assignedSales = req.query.assigned_sales as string;
    const interestedVehicle = req.query.interested_vehicle as string;
    const leadSource = req.query.lead_source as string;

    const results = await CustomerService.getCustomers({
      page,
      limit,
      search,
      hasPhone,
      platform,
      assignedSales,
      interestedVehicle,
      leadSource,
    });

    res.json({ success: true, ...results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/customers/all/clear - Delete all customer leads (Clean/Reset Database)
router.delete('/all/clear', async (_req: Request, res: Response) => {
  try {
    const count = await CustomerService.clearAllCustomers();
    res.json({
      success: true,
      message: `ลบข้อมูลลูกค้าและแชททั้งหมดเรียบร้อยแล้ว (${count} รายการ)`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/customers/:id - Delete single customer
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await CustomerService.deleteCustomer(id);
    res.json({
      success: true,
      message: 'ลบข้อมูลลูกค้าเรียบร้อยแล้ว',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/customers/messages/:messageId - Delete individual message
router.delete('/messages/:messageId', async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    await CustomerService.deleteMessage(messageId);
    res.json({
      success: true,
      message: 'ลบข้อความเรียบร้อยแล้ว',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/customers/:id/assign - Update interested vehicle & assigned salesperson
router.patch('/:id/assign', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { interestedVehicle, assignedSales, leadSource } = req.body;

    const updated = await CustomerService.updateSalesAssignment(id, {
      interestedVehicle,
      assignedSales,
      leadSource,
    });

    res.json({
      success: true,
      data: updated,
      message: `บันทึกข้อมูลเรียบร้อย: ${interestedVehicle || '-'} -> เซลล์ ${assignedSales || '-'}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/customers/:id/forward-sales - Generate formatted message for LINE to sales
router.post('/:id/forward-sales', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { phones: true },
    });

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const dateStr = customer.receivedDate || `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
    const timeStr = customer.receivedTime || `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

    const formattedSalesMessage = `🚨 [ส่งเคสลูกค้าใหม่]\n` +
      `📅 วันที่: ${dateStr} เวลา: ${timeStr}\n` +
      `🏢 ที่มา: ${customer.leadSource || 'FB เคพีศรีราชา'}\n` +
      `👤 ชื่อลูกค้า: ${customer.name}\n` +
      `📞 เบอร์โทร: ${customer.primaryPhone || 'ไม่มีเบอร์'}\n` +
      `🚛 รถที่สนใจ: ${customer.interestedVehicle || 'ยังไม่ระบุ'}\n` +
      `👨‍💼 เซลล์ที่รับ: ${customer.assignedSales || 'ยังไม่ระบุ'}\n` +
      `💬 ลิงก์โปรไฟล์: ${customer.profileUrl || 'Pancake Chat'}`;

    res.json({
      success: true,
      data: {
        text: formattedSalesMessage,
        customer,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/customers/stats - Dashboard and CRM statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await CustomerService.getStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/customers/export/csv - Download customer list as CSV matching Sheet format
router.get('/export/csv', async (_req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      include: { phones: true },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'วันที่รับ',
      'เวลา',
      'ที่มา',
      'ชื่อลูกค้า',
      'เบอร์โทร',
      'รถที่สนใจ',
      'เซลล์ที่รับ',
      'Pancake ID',
      'Tags',
    ];

    const rows = customers.map((c) => {
      const dateObj = new Date(c.lastContactAt || c.firstContactAt);
      const dateStr = c.receivedDate || `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
      const timeStr = c.receivedTime || `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

      let phoneStr = c.primaryPhone || '';
      if (phoneStr.length === 10) {
        phoneStr = `${phoneStr.substring(0, 3)}-${phoneStr.substring(3)}`;
      }

      let tagsStr = '';
      try {
        const parsed = JSON.parse(c.tags || '[]');
        tagsStr = Array.isArray(parsed) ? parsed.join(', ') : c.tags;
      } catch {
        tagsStr = c.tags || '';
      }

      return [
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${c.leadSource || 'FB เคพีศรีราชา'}"`,
        `"${c.name.replace(/"/g, '""')}"`,
        `"${phoneStr}"`,
        `"${c.interestedVehicle || ''}"`,
        `"${c.assignedSales || ''}"`,
        `"${c.pancakeCustomerId}"`,
        `"${tagsStr.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="pancake_sales_leads_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/customers/:id - Retrieve complete customer profile
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [{ id }, { pancakeCustomerId: id }],
      },
      include: {
        phones: true,
        messages: { orderBy: { sentAt: 'desc' }, take: 50 },
        orders: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/customers/sync/sheets - Trigger manual batch sync to Google Sheets
router.post('/sync/sheets', async (_req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      include: { phones: true },
      orderBy: { createdAt: 'asc' },
    });

    let syncedCount = 0;
    for (const c of customers) {
      const ok = await GoogleSheetsService.syncCustomer(c);
      if (ok) syncedCount++;
    }

    res.json({
      success: true,
      message: `Synced ${syncedCount} of ${customers.length} leads to Google Sheets`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
