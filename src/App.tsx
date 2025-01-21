import React, { useState, useRef, useEffect } from 'react';
import { Upload, Palette, Save, Paintbrush, Trash2, Plus, Check, X } from 'lucide-react';
import { colors } from './colors';

type Point = { x: number; y: number };

type Selection = {
  id: number;
  name: string;
  path: Path2D;
  points: Point[];
  color: string | null;
  colorName?: string;
  colorCode?: string;
};

type Color = {
  colorName: string;
  colorCode: string;
  colorTone: string;
  colorValue: string;
};

function App() {
  const [image, setImage] = useState<string | null>(null);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [currentSelection, setCurrentSelection] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [color, setColor] = useState('#FF0000');
  const [newSelectionName, setNewSelectionName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [colorData, setColorData] = useState<Color[]>([]);
  const [showColorList, setShowColorList] = useState(false);
  const [showSwatchMenu, setShowSwatchMenu] = useState(false);
  const [hoveredColor, setHoveredColor] = useState<Color | null>(null);
  const [showColorTooltip, setShowColorTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load colors from the data
  useEffect(() => {
    setColorData(colors);
  }, []);

  const drawCanvas = (ctx: CanvasRenderingContext2D, hideSelectionLines: boolean = false) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    selections.forEach(selection => {
      ctx.save();
      if (selection.color) {
        ctx.fillStyle = selection.color;
        ctx.fill(selection.path);
      }
      if (!hideSelectionLines) {
        ctx.strokeStyle = selection.id === selectedId ? '#00ff00' : '#000000';
        ctx.lineWidth = selection.id === selectedId ? 3 : 1;
        ctx.stroke(selection.path);
      }
      ctx.restore();
    });

    if (!hideSelectionLines && currentSelection.length > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(currentSelection[0].x, currentSelection[0].y);
      currentSelection.forEach((point, i) => {
        if (i > 0) ctx.lineTo(point.x, point.y);
      });
      currentSelection.forEach(point => {
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawCanvas(ctx);
  }, [selections, currentSelection, selectedId, image]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        if (canvasRef.current) {
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
          imageRef.current = img;
          setImage(event.target?.result as string);
          setSelections([]);
          setCurrentSelection([]);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

    setCurrentSelection(prev => [...prev, { x, y }]);
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || currentSelection.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawCanvas(ctx);

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(currentSelection[0].x, currentSelection[0].y);
    currentSelection.forEach((point, i) => {
      if (i > 0) ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(mouseX, mouseY);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    currentSelection.forEach(point => {
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  };

  const handleColorSelect = (selectedColor: Color) => {
    setColor(selectedColor.colorValue);
    setShowColorList(false);
    setShowSwatchMenu(false);
  };

  const handleColorHover = (e: React.MouseEvent, color: Color) => {
    setHoveredColor(color);
    setShowColorTooltip(true);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const handleColorLeave = () => {
    setShowColorTooltip(false);
    setHoveredColor(null);
  };

  const completeSelection = () => {
    if (currentSelection.length < 3) return;
    setShowNameInput(true);
  };

  const saveSelection = () => {
    if (currentSelection.length < 3 || !newSelectionName) return;

    const path = new Path2D();
    path.moveTo(currentSelection[0].x, currentSelection[0].y);
    currentSelection.forEach((point, i) => {
      if (i > 0) path.lineTo(point.x, point.y);
    });
    path.closePath();

    const newSelection: Selection = {
      id: Date.now(),
      name: newSelectionName,
      path,
      points: currentSelection,
      color: null,
    };

    setSelections(prev => [...prev, newSelection]);
    setCurrentSelection([]);
    setNewSelectionName('');
    setShowNameInput(false);
    setIsDrawing(false);
  };

  const colorSelection = () => {
    if (selectedId === null) return;

    const selectedColorData = colorData.find(c => c.colorValue === color);

    setSelections(prev =>
      prev.map(selection =>
        selection.id === selectedId
          ? {
              ...selection,
              color,
              colorName: selectedColorData?.colorName,
              colorCode: selectedColorData?.colorCode,
            }
          : selection
      )
    );
    setSelectedId(null);
  };

  const deleteSelection = () => {
    if (selectedId === null) return;
    setSelections(prev => prev.filter(selection => selection.id !== selectedId));
    setSelectedId(null);
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height + 100; // Extra space for color information
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw the image with selections
    drawCanvas(tempCtx, true);

    // Set a base position for the color information area below the canvas
tempCtx.fillStyle = '#ffffff';
tempCtx.fillRect(0, canvas.height, tempCanvas.width, 100); // Clear area for color information
tempCtx.fillStyle = '#000000'; // Set text color
tempCtx.font = '14px Arial'; // Set font

let y = canvas.height + 20; // Start y-coordinate for color info

// Draw the table headers
tempCtx.fillText('Color Name', 10, y);
tempCtx.fillText('Color Code', 150, y);
tempCtx.fillText('Color Tone', 300, y);
y += 20;

// Assuming colors is an array of your color objects
colors.forEach(color => {
  // Destructure the properties from the color object
  const { colorName, colorCode, colorTone } = color;

  // Draw the table rows
  tempCtx.fillText(colorName, 10, y);
  tempCtx.fillText(colorCode, 150, y);
  tempCtx.fillText(colorTone, 300, y);

  // Increment the y-coordinate for the next row
  y += 20;
});

    const link = document.createElement('a');
    link.download = 'colored-house.png';
    link.href = tempCanvas.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Home Visualizer</h1>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition">
              <Upload size={20} />
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => {
                setIsDrawing(true);
                setSelectedId(null);
                setCurrentSelection([]);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isDrawing ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Plus size={20} />
              New Selection
            </button>

            {isDrawing && currentSelection.length > 0 && (
              <button
                onClick={completeSelection}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                <Check size={20} />
                Complete Selection
              </button>
            )}

            {isDrawing && (
              <button
                onClick={() => {
                  setIsDrawing(false);
                  setCurrentSelection([]);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                <X size={20} />
                Cancel Selection
              </button>
            )}

<div className="relative flex items-center gap-2">
    <Palette size={20} className="text-gray-600" />
    <button 
        onClick={() => setShowColorList(!showColorList)}
        className="relative border-2 border-gray-300 rounded p-1"
        onMouseEnter={(e) => handleColorHover(e, colorData.find(c => c.colorValue === color) || colorData[0])}
        onMouseLeave={handleColorLeave}
    >
        <span className="w-8 h-8 rounded block" style={{ backgroundColor: color }} />
    </button>
    {showColorList && (
        <div className="absolute z-10 mt-2 top-full left-0 bg-white shadow-lg rounded border">
            <div className="max-h-56 overflow-y-auto">
                {colorData.map((colorItem) => (
                    <div
                        key={colorItem.colorCode}
                        onClick={() => handleColorSelect(colorItem)}
                        onMouseEnter={(e) => handleColorHover(e, colorItem)}
                        onMouseLeave={handleColorLeave}
                        className="flex items-center p-2 cursor-pointer hover:bg-gray-100"
                    >
                        <span 
                            className="w-8 h-8 inline-block mr-2 rounded border" 
                            style={{ backgroundColor: colorItem.colorValue }} 
                        />
                        <span
                            className={`text-sm font-medium transition-opacity duration-300 ${
                                hoveredColor?.colorValue === colorItem.colorValue ? 'opacity-100' : 'opacity-0'
                            }`}
                        >
                            {colorItem.colorName}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )}
</div>

            <button
              onClick={colorSelection}
              disabled={selectedId === null}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                selectedId !== null
                  ? 'bg-purple-500 text-white hover:bg-purple-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Paintbrush size={20} />
              Apply Color
            </button>

            <button
              onClick={deleteSelection}
              disabled={selectedId === null}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                selectedId !== null
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Trash2 size={20} />
              Delete Selection
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              disabled={!image}
            >
              <Save size={20} />
              Save Image
            </button>

            <button
              onClick={() => setShowSwatchMenu(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400 transition"
            >
              Colors
            </button>
          </div>

          {showColorTooltip && hoveredColor && (
            <div
              className="fixed z-50 bg-white shadow-lg rounded-lg p-3 text-sm"
              style={{
                left: tooltipPosition.x + 10,
                top: tooltipPosition.y + 10,
              }}
            >
              <p className="font-semibold">{hoveredColor.colorName}</p>
              <p>{hoveredColor.colorCode}</p>
              <p>{hoveredColor.colorTone}</p>
            </div>
          )}

          {showSwatchMenu && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
                <h3 className="text-lg font-semibold mb-4">Color Palette</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {colorData.map((colorItem) => (
                    <div
                      key={colorItem.colorCode}
                      className="colour-swatch-card p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => handleColorSelect(colorItem)}
                      onMouseEnter={(e) => handleColorHover(e, colorItem)}
                      onMouseLeave={handleColorLeave}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full"
                          style={{ backgroundColor: colorItem.colorValue }}
                        />
                        <div>
                          <p className="font-medium">{colorItem.colorName}</p>
                          <p className="text-sm text-gray-500">{colorItem.colorCode}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setShowSwatchMenu(false)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-6">
            <div className="w-64 bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Selections</h2>
              {selections.length === 0 ? (
                <p className="text-gray-500 text-sm">No selections created yet</p>
              ) : (
                <div className="space-y-2">
                  {selections.map(selection => (
                    <div
                      key={selection.id}
                      onClick={() => setSelectedId(selection.id)}
                      className={`p-3 rounded cursor-pointer flex items-center justify-between ${
                        selectedId === selection.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                      }`}
                    >
                      <span>{selection.name}</span>
                      {selection.color && (
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: selection.color }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                {!image && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    Upload an image to start
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  onMouseMove={handleCanvasMove}
                  className={`max-w-full h-auto ${isDrawing ? 'cursor-crosshair' : 'cursor-default'}`}
                />
              </div>
            </div>
          </div>

          {showNameInput && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl">
                <h3 className="text-lg font-semibold mb-4">Name your selection</h3>
                <input
                  type="text"
                  value={newSelectionName}
                  onChange={(e) => setNewSelectionName(e.target.value)}
                  placeholder="e.g., Front Wall, Roof, etc."
                  className="w-full px-3 py-2 border rounded mb-4"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowNameInput(false);
                      setCurrentSelection([]);
                      setNewSelectionName('');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSelection}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
                  >
                    <Check size={16} />
                    Save Selection
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600">
            <p>Instructions:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Upload an image of your house</li>
              <li>Click "New Selection" to start creating an area</li>
              <li>Click points to create a selection - points will be connected automatically</li>
              <li>Click "Complete Selection" when you're done marking points</li>
              <li>Name your selection when prompted</li>
              <li>Select the area from the list and choose a color</li>
              <li>Click "Apply Color" to color the selected area</li>
              <li>Repeat for other areas you want to color</li>
              <li>Click "Save Image" to save your visualization with color details</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;