const express = require('express');
const router = express.Router();

function check(input = {}) {
  const rooms = input.rooms || [
    { room: 'Kitchen', aisle_inches: 32, egress_clear: true, outlet_spacing_ft: 14 },
    { room: 'Nursery', aisle_inches: 42, egress_clear: false, outlet_spacing_ft: 8 },
  ];
  return { rooms: rooms.map((r) => {
    const issues = [r.aisle_inches < 36 && 'Aisle below 36 inches', !r.egress_clear && 'Egress obstruction', r.outlet_spacing_ft > 12 && 'Outlet spacing review'].filter(Boolean);
    return { ...r, issues, status: issues.length ? 'revise_layout' : 'compliant' };
  }) };
}

router.get('/', (req, res) => res.json(check()));
router.post('/check', (req, res) => res.json(check(req.body || {})));
module.exports = router;
