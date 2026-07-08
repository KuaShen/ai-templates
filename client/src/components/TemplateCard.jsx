import { Link } from 'react-router-dom';
import { Download, Heart, Coins, ImageIcon } from 'lucide-react';
import { useState } from 'react';

const platformColors = {
  midjourney: 'bg-violet-50 text-violet-700',
  dalle3: 'bg-green-50 text-green-700',
  'stable-diffusion': 'bg-blue-50 text-blue-700',
  firefly: 'bg-orange-50 text-orange-700',
};

const platformLabels = {
  midjourney: 'Midjourney',
  dalle3: 'DALL·E 3',
  'stable-diffusion': 'Stable Diffusion',
  firefly: 'Adobe Firefly',
};

export default function TemplateCard({ template }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link to={`/template/${template.id}`} className="card overflow-hidden group flex flex-col">
      {/* Preview Image */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {!imgError ? (
          <img
            src={template.preview_url || placeholderImage(template)}
            alt={template.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <ImageIcon className="w-10 h-10 mb-2" />
            <span className="text-xs">预览图生成中</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {template.is_free ? (
            <span className="badge-green text-xs">免费</span>
          ) : (
            <span className="badge-orange text-xs flex items-center gap-1">
              <Coins className="w-3 h-3" />{template.price}
            </span>
          )}
        </div>

        {/* Platform badge */}
        <div className="absolute top-2 right-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${platformColors[template.ai_platform] || 'bg-gray-50 text-gray-600'}`}>
            {platformLabels[template.ai_platform] || template.ai_platform}
          </span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1 leading-snug">{template.title}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-2 flex-1">{template.description}</p>
        <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-50">
          <span className="flex items-center gap-1">
            <Download className="w-3 h-3" /> {template.downloads}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" /> {template.likes}
          </span>
        </div>
      </div>
    </Link>
  );
}

function placeholderImage(template) {
  // Generate a gradient placeholder based on template id
  const colors = [
    'from-blue-100 to-purple-100',
    'from-green-100 to-teal-100',
    'from-amber-100 to-orange-100',
    'from-rose-100 to-pink-100',
    'from-cyan-100 to-blue-100',
    'from-violet-100 to-indigo-100',
  ];
  const idx = template.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${colors[idx].split(' ')[0].replace('from-', '#').replace('-100', '')}"/><stop offset="100%" stop-color="${colors[idx].split(' ')[1].replace('to-', '#').replace('-100', '')}"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><text x="200" y="140" text-anchor="middle" fill="white" font-size="16" opacity="0.6">${template.title.slice(0, 12)}</text><text x="200" y="165" text-anchor="middle" fill="white" font-size="12" opacity="0.4">AI 生成预览</text></svg>`)}`;
}
