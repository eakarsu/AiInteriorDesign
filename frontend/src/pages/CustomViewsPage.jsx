import React from 'react';
import RoomStyleDistributionChart from '../components/RoomStyleDistributionChart';
import ColorPaletteHeatmap from '../components/ColorPaletteHeatmap';
import DesignBriefPdf from '../components/DesignBriefPdf';
import DesignStyleRulesEditor from '../components/DesignStyleRulesEditor';
import { Eye } from 'lucide-react';

const CustomViewsPage = () => {
  return (
    <div className="space-y-6" data-testid="custom-views-page">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-xl flex items-center justify-center">
          <Eye className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Design Views</h1>
          <p className="text-sm text-gray-500">
            Custom dashboards and tools — style distribution, palette heatmap, design brief, and style rules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RoomStyleDistributionChart />
        <ColorPaletteHeatmap />
      </div>

      <DesignBriefPdf />
      <DesignStyleRulesEditor />
    </div>
  );
};

export default CustomViewsPage;
