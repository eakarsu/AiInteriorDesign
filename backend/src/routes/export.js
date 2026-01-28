const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const PDFDocument = require('pdfkit');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to fetch image as buffer
async function fetchImageBuffer(url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  } catch (err) {
    console.log('Failed to fetch image:', err.message);
  }
  return null;
}

// Export design as PDF
router.get('/design/:id/pdf', authenticateToken, async (req, res) => {
  try {
    const design = await prisma.design.findUnique({
      where: { id: req.params.id },
      include: {
        furniture: true,
        palettes: true,
        rooms: true,
        user: {
          select: { name: true, email: true }
        }
      }
    });

    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }

    if (design.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `${design.name} - Design Proposal`,
        Author: 'AI Interior Design',
        Subject: 'Interior Design Proposal'
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${design.name.replace(/[^a-zA-Z0-9]/g, '_')}_proposal.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Colors
    const primaryColor = '#2563eb';
    const textColor = '#1f2937';
    const lightGray = '#6b7280';

    // Header
    doc.fontSize(28)
       .fillColor(primaryColor)
       .text('AI Interior Design', { align: 'center' });

    doc.moveDown(0.5);
    doc.fontSize(12)
       .fillColor(lightGray)
       .text('Design Proposal', { align: 'center' });

    doc.moveDown(2);

    // Design Title
    doc.fontSize(24)
       .fillColor(textColor)
       .text(design.name, { align: 'center' });

    doc.moveDown(1);

    // Design Image (if available)
    const imageUrl = design.thumbnail || design.imageUrl;
    if (imageUrl) {
      try {
        const imageBuffer = await fetchImageBuffer(imageUrl);
        if (imageBuffer) {
          const imgWidth = 400;
          const xPos = (doc.page.width - imgWidth) / 2;
          doc.image(imageBuffer, xPos, doc.y, { width: imgWidth });
          doc.moveDown(1);
          doc.y += 220; // Move past the image
        }
      } catch (imgErr) {
        console.log('Could not add image to PDF:', imgErr.message);
      }
    }

    doc.moveDown(1);

    // Design Details Box
    doc.fontSize(14)
       .fillColor(primaryColor)
       .text('Design Details');

    doc.moveDown(0.5);
    doc.fontSize(11).fillColor(textColor);

    const details = [
      ['Style', design.style || 'Not specified'],
      ['Room Type', design.roomType || 'Not specified'],
      ['Budget', design.budget ? `$${design.budget.toLocaleString()}` : 'Flexible'],
      ['Status', design.status || 'Draft'],
      ['Created', new Date(design.createdAt).toLocaleDateString()]
    ];

    details.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(`${label}: `, { continued: true })
         .font('Helvetica').text(value);
    });

    doc.moveDown(1.5);

    // Description
    if (design.description) {
      doc.fontSize(14)
         .fillColor(primaryColor)
         .text('Description');

      doc.moveDown(0.5);
      doc.fontSize(11)
         .fillColor(textColor)
         .text(design.description);

      doc.moveDown(1.5);
    }

    // Rooms
    if (design.rooms && design.rooms.length > 0) {
      doc.fontSize(14)
         .fillColor(primaryColor)
         .text('Rooms');

      doc.moveDown(0.5);
      doc.fontSize(11).fillColor(textColor);

      design.rooms.forEach((room, index) => {
        doc.font('Helvetica-Bold').text(`${index + 1}. ${room.name}`, { continued: true });
        doc.font('Helvetica').text(` (${room.type})`);
        if (room.width && room.length) {
          doc.fillColor(lightGray)
             .text(`   Dimensions: ${room.width}m x ${room.length}m${room.height ? ` x ${room.height}m` : ''}`);
        }
        doc.fillColor(textColor);
      });

      doc.moveDown(1.5);
    }

    // Furniture List
    if (design.furniture && design.furniture.length > 0) {
      // Check if we need a new page
      if (doc.y > 600) {
        doc.addPage();
      }

      doc.fontSize(14)
         .fillColor(primaryColor)
         .text('Furniture List');

      doc.moveDown(0.5);

      // Table header
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 200;
      const col3 = 350;
      const col4 = 450;

      doc.fontSize(10)
         .fillColor(lightGray)
         .text('Item', col1, tableTop)
         .text('Category', col2, tableTop)
         .text('Material', col3, tableTop)
         .text('Price', col4, tableTop);

      doc.moveTo(col1, tableTop + 15)
         .lineTo(550, tableTop + 15)
         .stroke(lightGray);

      let yPosition = tableTop + 25;
      let totalPrice = 0;

      design.furniture.forEach((item) => {
        if (yPosition > 750) {
          doc.addPage();
          yPosition = 50;
        }

        doc.fontSize(10).fillColor(textColor);
        doc.text(item.name || 'Unnamed', col1, yPosition, { width: 140 });
        doc.text(item.category || '-', col2, yPosition, { width: 140 });
        doc.text(item.material || '-', col3, yPosition, { width: 90 });
        doc.text(item.price ? `$${item.price.toLocaleString()}` : '-', col4, yPosition);

        if (item.price) totalPrice += item.price;

        // Store link if available
        if (item.storeUrl && item.storeName) {
          yPosition += 12;
          doc.fontSize(8)
             .fillColor(primaryColor)
             .text(`Available at ${item.storeName}`, col1, yPosition);
        }

        yPosition += 20;
      });

      // Total
      doc.moveTo(col1, yPosition)
         .lineTo(550, yPosition)
         .stroke(lightGray);

      yPosition += 10;
      doc.fontSize(11)
         .fillColor(textColor)
         .font('Helvetica-Bold')
         .text('Total Estimated Cost:', col3 - 50, yPosition)
         .text(`$${totalPrice.toLocaleString()}`, col4, yPosition);

      doc.font('Helvetica');
      doc.moveDown(2);
    }

    // Color Palettes
    if (design.palettes && design.palettes.length > 0) {
      // Check if we need a new page
      if (doc.y > 650) {
        doc.addPage();
      }

      doc.fontSize(14)
         .fillColor(primaryColor)
         .text('Color Palettes');

      doc.moveDown(0.5);

      design.palettes.forEach((palette) => {
        doc.fontSize(11)
           .fillColor(textColor)
           .font('Helvetica-Bold')
           .text(palette.name);

        if (palette.mood) {
          doc.font('Helvetica')
             .fontSize(9)
             .fillColor(lightGray)
             .text(`Mood: ${palette.mood}`);
        }

        // Parse colors
        let colors = [];
        try {
          colors = JSON.parse(palette.colors);
        } catch {
          colors = palette.colors.split(',').map(c => c.trim());
        }

        // Draw color swatches
        const swatchSize = 30;
        const startX = 50;
        let currentX = startX;
        const swatchY = doc.y + 5;

        colors.slice(0, 6).forEach((color) => {
          const hexColor = typeof color === 'object' ? color.hex : color;
          if (hexColor && hexColor.startsWith('#')) {
            doc.rect(currentX, swatchY, swatchSize, swatchSize)
               .fill(hexColor);

            // Color label
            doc.fontSize(7)
               .fillColor(textColor)
               .text(hexColor, currentX, swatchY + swatchSize + 3, { width: swatchSize, align: 'center' });

            currentX += swatchSize + 15;
          }
        });

        doc.y = swatchY + swatchSize + 20;
        doc.moveDown(0.5);
      });
    }

    // Footer
    doc.addPage();
    doc.fontSize(10)
       .fillColor(lightGray)
       .text('Generated by AI Interior Design', { align: 'center' });

    doc.moveDown(0.5);
    doc.text(`Prepared for: ${design.user.name || design.user.email}`, { align: 'center' });

    doc.moveDown(0.5);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' });

    doc.moveDown(2);
    doc.fontSize(9)
       .text('This design proposal is generated by AI and should be reviewed by a professional interior designer before implementation.', {
         align: 'center',
         width: 400
       });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ error: 'Failed to export PDF', message: error.message });
  }
});

// Export shopping list as PDF
router.get('/shopping/:id/pdf', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.shoppingList.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: {
            furniture: true
          },
          orderBy: { createdAt: 'asc' }
        },
        user: {
          select: { name: true, email: true }
        }
      }
    });

    if (!list) {
      return res.status(404).json({ error: 'Shopping list not found' });
    }

    if (list.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `${list.name} - Shopping List`,
        Author: 'AI Interior Design',
        Subject: 'Shopping List'
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${list.name.replace(/[^a-zA-Z0-9]/g, '_')}_shopping_list.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Colors
    const primaryColor = '#2563eb';
    const textColor = '#1f2937';
    const lightGray = '#6b7280';
    const successColor = '#10b981';

    // Header
    doc.fontSize(28)
       .fillColor(primaryColor)
       .text('Shopping List', { align: 'center' });

    doc.moveDown(0.5);
    doc.fontSize(18)
       .fillColor(textColor)
       .text(list.name, { align: 'center' });

    if (list.description) {
      doc.moveDown(0.5);
      doc.fontSize(10)
         .fillColor(lightGray)
         .text(list.description, { align: 'center' });
    }

    doc.moveDown(2);

    // Summary
    const totalItems = list.items.length;
    const purchasedItems = list.items.filter(i => i.purchased).length;
    const totalPrice = list.items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);

    doc.fontSize(12).fillColor(textColor);
    doc.text(`Total Items: ${totalItems}`, { continued: true });
    doc.text(`   Purchased: ${purchasedItems}/${totalItems}`, { continued: true });
    doc.text(`   Total: $${totalPrice.toLocaleString()}`);

    doc.moveDown(1.5);

    // Items grouped by store
    const itemsByStore = {};
    list.items.forEach(item => {
      const store = item.storeName || 'Other';
      if (!itemsByStore[store]) {
        itemsByStore[store] = [];
      }
      itemsByStore[store].push(item);
    });

    Object.entries(itemsByStore).forEach(([store, items]) => {
      // Check if we need a new page
      if (doc.y > 650) {
        doc.addPage();
      }

      const storeTotal = items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);

      doc.fontSize(14)
         .fillColor(primaryColor)
         .text(`${store} ($${storeTotal.toLocaleString()})`);

      doc.moveDown(0.3);

      items.forEach((item, index) => {
        if (doc.y > 750) {
          doc.addPage();
        }

        const checkbox = item.purchased ? '[x]' : '[ ]';
        const priceText = item.price ? `$${(item.price * item.quantity).toLocaleString()}` : '';
        const qtyText = item.quantity > 1 ? ` (x${item.quantity})` : '';

        doc.fontSize(10)
           .fillColor(item.purchased ? successColor : textColor)
           .text(`${checkbox} ${item.name}${qtyText}`, 60, doc.y, { continued: true, width: 350 });

        doc.text(priceText, { align: 'right' });

        if (item.storeUrl) {
          doc.fontSize(8)
             .fillColor(primaryColor)
             .text(`    Link: ${item.storeUrl}`, 60);
        }

        if (item.notes) {
          doc.fontSize(8)
             .fillColor(lightGray)
             .text(`    Note: ${item.notes}`, 60);
        }
      });

      doc.moveDown(1);
    });

    // Footer
    doc.moveDown(2);
    doc.fontSize(9)
       .fillColor(lightGray)
       .text(`Generated on ${new Date().toLocaleDateString()} by AI Interior Design`, { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Export shopping list PDF error:', error);
    res.status(500).json({ error: 'Failed to export PDF', message: error.message });
  }
});

module.exports = router;
