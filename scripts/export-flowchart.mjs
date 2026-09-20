import fs from 'fs';

async function generate() {
  const mmd = fs.readFileSync('agriflow_flowchart.mmd', 'utf8');
  const payload = {
    code: mmd,
    mermaid: {
      theme: 'dark',
      themeVariables: {
        fontSize: '14px',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    }
  };
  
  const base64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  console.log('Fetching SVG from mermaid.ink...');
  
  try {
    const svgRes = await fetch(`https://mermaid.ink/svg/${base64}`);
    if (svgRes.ok) {
      const svgText = await svgRes.text();
      fs.writeFileSync('agriflow_flowchart.svg', svgText, 'utf8');
      console.log('SUCCESS: Generated agriflow_flowchart.svg (Size: ' + svgText.length + ' bytes)');
    } else {
      console.log('SVG fetch failed status:', svgRes.status);
    }
  } catch (err) {
    console.log('SVG fetch error:', err.message);
  }

  console.log('Fetching PNG from mermaid.ink...');
  try {
    const pngRes = await fetch(`https://mermaid.ink/img/${base64}`);
    if (pngRes.ok) {
      const arrayBuffer = await pngRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync('agriflow_flowchart.png', buffer);
      console.log('SUCCESS: Generated agriflow_flowchart.png (Size: ' + buffer.length + ' bytes)');
    } else {
      console.log('PNG fetch failed status:', pngRes.status);
    }
  } catch (err) {
    console.log('PNG fetch error:', err.message);
  }
}

generate();
