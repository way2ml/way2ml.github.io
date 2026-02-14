/**
 * Molecular Viewer Helper
 * Usage: createMolViewer("viewerId", "https://path/to/file.xyz", options)
 * 
 * Supported formats: xyz, poscar, vasp, cif, pdb, sdf, mol2
 * 
 * Options:
 *   height: viewer height (default: "500px")
 *   background: background color (default: "white")
 *   style: "ball-stick" | "stick" | "sphere" | "line" (default: "ball-stick")
 *   showBox: show unit cell box (default: true)
 *   showControls: show view control buttons (default: true)
 *   format: force format (auto-detected from extension if not specified)
 *   caption: text to display at top-left corner of canvas
 *   showHbonds: show hydrogen bonds (default: false)
 *   hbondCutoff: H-bond distance cutoff in Angstroms (default: 3.5)
 *   extendX: extend structure periodically in X (a) direction, e.g., 0.3 extends 0.3 cell on each side (default: 0)
 *   extendY: extend structure periodically in Y (b) direction, e.g., 0.3 extends 0.3 cell on each side (default: 0)
 *   extendZ: extend structure periodically in Z (c) direction, e.g., 0.3 extends 0.3 cell on each side (default: 0)
 *   fadeExtended: show extended atoms with reduced opacity (default: false)
 *   zoom: zoom level multiplier (default: 1.0, larger = zoom out)
 *   showBorder: show border around canvas (default: true)
 *   view: initial view direction: "c", "c*", "b", "b*", "a", "a*" (default: default 3Dmol view)
 */

// Draw hydrogen bonds between atoms, excluding deleted atoms
// Returns array of shape references for later removal
function drawHydrogenBonds(viewer, hbondCutoff, deletedSerials, existingHbondShapes) {
    // Remove existing H-bond cylinders only (not the unit cell box)
    if (existingHbondShapes && existingHbondShapes.length > 0) {
        for (const shape of existingHbondShapes) {
            viewer.removeShape(shape);
        }
    }
    
    const hbondShapes = [];
    
    // Get all atoms from ALL models (including periodic images)
    const atoms = viewer.selectedAtoms({});
    
    // Filter out deleted atoms
    const activeAtoms = atoms.filter(a => !deletedSerials.has(a.serial));
    
    // Find O atoms (donors/acceptors) and H atoms
    const oxygens = activeAtoms.filter(a => a.elem === 'O');
    const hydrogens = activeAtoms.filter(a => a.elem === 'H');
    
    // For each H, check if it's bonded to O and close to another O
    for (const h of hydrogens) {
        // Find donor O (covalently bonded to this H, ~1.0 Å)
        let donorO = null;
        let minDonorDist = 1.3; // O-H covalent bond < 1.3 Å
        
        for (const o of oxygens) {
            const dist = Math.sqrt(
                Math.pow(h.x - o.x, 2) + 
                Math.pow(h.y - o.y, 2) + 
                Math.pow(h.z - o.z, 2)
            );
            if (dist < minDonorDist) {
                minDonorDist = dist;
                donorO = o;
            }
        }
        
        if (!donorO) continue;
        
        // Find acceptor O (H-bond distance 1.5-2.5 Å from H, O...O < cutoff)
        for (const acceptorO of oxygens) {
            if (acceptorO === donorO) continue;
            
            // O...O distance
            const ooDistance = Math.sqrt(
                Math.pow(donorO.x - acceptorO.x, 2) + 
                Math.pow(donorO.y - acceptorO.y, 2) + 
                Math.pow(donorO.z - acceptorO.z, 2)
            );
            
            // H...O distance
            const hoDistance = Math.sqrt(
                Math.pow(h.x - acceptorO.x, 2) + 
                Math.pow(h.y - acceptorO.y, 2) + 
                Math.pow(h.z - acceptorO.z, 2)
            );
            
            // H-bond criteria: O...O < cutoff (default 3.2 Å) and H...O between 1.5-2.5 Å
            if (ooDistance < hbondCutoff && hoDistance > 1.4 && hoDistance < 2.5) {
                // Draw dashed line for H-bond
                const shape = viewer.addCylinder({
                    start: {x: h.x, y: h.y, z: h.z},
                    end: {x: acceptorO.x, y: acceptorO.y, z: acceptorO.z},
                    radius: 0.08,
                    color: 'blue',
                    dashed: true,
                    dashLength: 0.25,
                    gapLength: 0.12
                });
                hbondShapes.push(shape);
            }
        }
    }
    
    return hbondShapes;
}

// Convert POSCAR/VASP format to XYZ with lattice info
// Returns object with xyz string and metadata for saving back to POSCAR
function poscarToXyz(poscarText) {
    const lines = poscarText.trim().split('\n');
    let idx = 0;
    
    // Line 0: Comment
    const comment = lines[idx++];
    
    // Line 1: Scale factor
    const scale = parseFloat(lines[idx++]);
    
    // Lines 2-4: Lattice vectors
    const lattice = [];
    for (let i = 0; i < 3; i++) {
        const parts = lines[idx++].trim().split(/\s+/).map(x => parseFloat(x) * scale);
        lattice.push(parts);
    }
    
    // Line 5: Element symbols (VASP 5+) or counts
    let elements = [];
    let counts = [];
    const line5 = lines[idx].trim().split(/\s+/);
    
    if (isNaN(parseInt(line5[0]))) {
        // VASP 5+ format: element symbols
        elements = line5;
        idx++;
        counts = lines[idx++].trim().split(/\s+/).map(x => parseInt(x));
    } else {
        // VASP 4 format: no element symbols, just counts
        // Try to get elements from comment line or use placeholders
        counts = line5.map(x => parseInt(x));
        idx++;
        // Use generic element names
        elements = counts.map((_, i) => `X${i+1}`);
    }
    
    // Check for Selective dynamics
    let selectiveDynamics = false;
    if (lines[idx].trim()[0].toLowerCase() === 's') {
        selectiveDynamics = true;
        idx++;
    }
    
    // Coordinate type: Direct or Cartesian
    const coordType = lines[idx++].trim()[0].toLowerCase();
    const isDirect = (coordType === 'd');
    
    // Build element list
    const atomElements = [];
    for (let i = 0; i < elements.length; i++) {
        for (let j = 0; j < counts[i]; j++) {
            atomElements.push(elements[i]);
        }
    }
    
    // Read positions and selective dynamics flags
    const totalAtoms = counts.reduce((a, b) => a + b, 0);
    const positions = [];
    const fractionalPositions = [];
    const selectiveFlags = [];
    
    for (let i = 0; i < totalAtoms; i++) {
        const parts = lines[idx++].trim().split(/\s+/);
        let x = parseFloat(parts[0]), y = parseFloat(parts[1]), z = parseFloat(parts[2]);
        
        // Store selective dynamics flags if present
        if (selectiveDynamics && parts.length >= 6) {
            selectiveFlags.push([parts[3], parts[4], parts[5]]);
        } else {
            selectiveFlags.push(['T', 'T', 'T']); // Default to all movable
        }
        
        if (isDirect) {
            // Store fractional positions for later
            fractionalPositions.push([x, y, z]);
            // Convert fractional to Cartesian
            const cx = x * lattice[0][0] + y * lattice[1][0] + z * lattice[2][0];
            const cy = x * lattice[0][1] + y * lattice[1][1] + z * lattice[2][1];
            const cz = x * lattice[0][2] + y * lattice[1][2] + z * lattice[2][2];
            positions.push([cx, cy, cz]);
        } else {
            positions.push([x * scale, y * scale, z * scale]);
            // Convert Cartesian to fractional for POSCAR output
            // Using inverse of lattice matrix
            const det = lattice[0][0] * (lattice[1][1] * lattice[2][2] - lattice[1][2] * lattice[2][1])
                      - lattice[0][1] * (lattice[1][0] * lattice[2][2] - lattice[1][2] * lattice[2][0])
                      + lattice[0][2] * (lattice[1][0] * lattice[2][1] - lattice[1][1] * lattice[2][0]);
            const inv = [
                [(lattice[1][1] * lattice[2][2] - lattice[1][2] * lattice[2][1]) / det,
                 (lattice[1][2] * lattice[2][0] - lattice[1][0] * lattice[2][2]) / det,
                 (lattice[1][0] * lattice[2][1] - lattice[1][1] * lattice[2][0]) / det],
                [(lattice[2][1] * lattice[0][2] - lattice[2][2] * lattice[0][1]) / det,
                 (lattice[2][2] * lattice[0][0] - lattice[2][0] * lattice[0][2]) / det,
                 (lattice[2][0] * lattice[0][1] - lattice[2][1] * lattice[0][0]) / det],
                [(lattice[0][1] * lattice[1][2] - lattice[0][2] * lattice[1][1]) / det,
                 (lattice[0][2] * lattice[1][0] - lattice[0][0] * lattice[1][2]) / det,
                 (lattice[0][0] * lattice[1][1] - lattice[0][1] * lattice[1][0]) / det]
            ];
            const fx = inv[0][0] * x * scale + inv[0][1] * y * scale + inv[0][2] * z * scale;
            const fy = inv[1][0] * x * scale + inv[1][1] * y * scale + inv[1][2] * z * scale;
            const fz = inv[2][0] * x * scale + inv[2][1] * y * scale + inv[2][2] * z * scale;
            fractionalPositions.push([fx, fy, fz]);
        }
    }
    
    // Build XYZ with extended format (includes lattice)
    const latticeStr = `${lattice[0].join(' ')} ${lattice[1].join(' ')} ${lattice[2].join(' ')}`;
    let xyz = `${totalAtoms}\n`;
    xyz += `Lattice="${latticeStr}" Properties=species:S:1:pos:R:3 pbc="T T T"\n`;
    
    for (let i = 0; i < totalAtoms; i++) {
        xyz += `${atomElements[i]} ${positions[i][0].toFixed(8)} ${positions[i][1].toFixed(8)} ${positions[i][2].toFixed(8)}\n`;
    }
    
    // Return both xyz and metadata
    return {
        xyz: xyz,
        poscarData: {
            comment: comment,
            scale: scale,
            lattice: lattice,
            elements: elements,
            counts: counts,
            selectiveDynamics: selectiveDynamics,
            fractionalPositions: fractionalPositions,
            selectiveFlags: selectiveFlags,
            atomElements: atomElements
        }
    };
}

// Detect file format from URL/filename
function detectFormat(url) {
    const lower = url.toLowerCase();
    if (lower.includes('poscar') || lower.includes('contcar')) return 'poscar';
    if (lower.endsWith('.vasp')) return 'poscar';
    if (lower.endsWith('.xyz')) return 'xyz';
    if (lower.endsWith('.cif')) return 'cif';
    if (lower.endsWith('.pdb')) return 'pdb';
    if (lower.endsWith('.sdf')) return 'sdf';
    if (lower.endsWith('.mol2')) return 'mol2';
    return 'xyz'; // default
}

function createMolViewer(containerId, fileUrl, options = {}) {
    const opts = {
        height: options.height || "500px",
        background: options.background || "white",
        style: options.style || "ball-stick",
        showBox: options.showBox !== false,
        showControls: options.showControls !== false,
        format: options.format || detectFormat(fileUrl),
        caption: options.caption || "",
        showHbonds: options.showHbonds === true,
        hbondCutoff: options.hbondCutoff || 3.5,
        extendX: parseFloat(options.extendX) || 0,
        extendY: parseFloat(options.extendY) || 0,
        extendZ: parseFloat(options.extendZ) || 0,
        fadeExtended: options.fadeExtended === true,  // default false
        zoom: parseFloat(options.zoom) || 1.0,
        showBorder: options.showBorder !== false,  // default true
        view: options.view || ''  // initial view direction
    };

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container #${containerId} not found`);
        return;
    }

    // Create HTML structure
    let html = '';
    const btnStyle = 'border-radius: 4px; padding: 4px 8px; margin: 1px; border: 1px solid #ccc; cursor: pointer;';
    if (opts.showControls) {
        html += `<div style="margin-bottom: 6px; display: flex; flex-wrap: wrap; align-items: center; gap: 2px;">
            <button style="${btnStyle}" onclick="molViewers['${containerId}'].setView('top')" title="Top (c)">c</button>
            <button style="${btnStyle}" onclick="molViewers['${containerId}'].setView('bottom')" title="Bottom (-c)">c*</button>
            <button style="${btnStyle}" onclick="molViewers['${containerId}'].setView('front')" title="Front (b)">b</button>
            <button style="${btnStyle}" onclick="molViewers['${containerId}'].setView('back')" title="Back (-b)">b*</button>
            <button style="${btnStyle}" onclick="molViewers['${containerId}'].setView('left')" title="Left (-a)">a*</button>
            <button style="${btnStyle}" onclick="molViewers['${containerId}'].setView('right')" title="Right (a)">a</button>
            <button style="${btnStyle}" onclick="molViewers['${containerId}'].clearSelection()" title="Clear selection">Clear</button>
            <button style="${btnStyle} background-color: #ff6b6b; color: white; border-color: #ff6b6b;" onclick="molViewers['${containerId}'].deleteSelected()" title="Delete selected atoms">Delete</button>
            <button style="${btnStyle} background-color: #4CAF50; color: white; border-color: #4CAF50;" onclick="molViewers['${containerId}'].saveStructure()" title="Save structure">Save</button>
            <span id="${containerId}_selection_info" style="margin-left: 6px; color: #666; font-size: 12px;"></span>
        </div>`;
    }
    const borderStyle = opts.showBorder ? 'border: 1px solid #ccc; box-sizing: border-box; overflow: hidden;' : 'overflow: hidden;';
    html += `<div id="${containerId}_canvas" style="width: 100%; height: ${opts.height}; position: relative; ${borderStyle}">`;
    if (opts.caption) {
        html += `<div style="position: absolute; top: 10px; left: 10px; z-index: 100; background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 4px; font-size: 14px; pointer-events: none;">${opts.caption}</div>`;
    }
    html += `<div id="${containerId}_atom_info" style="position: absolute; bottom: 10px; left: 10px; z-index: 100; background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; pointer-events: none; display: none; font-family: monospace;"></div>`;
    html += `</div>`;
    container.innerHTML = html;

    // Store viewer instances globally
    if (!window.molViewers) window.molViewers = {};

    // Get style settings
    function getStyleSpec(styleName) {
        switch(styleName) {
            case 'stick': return {stick: {radius: 0.15}};
            case 'sphere': return {sphere: {scale: 0.5}};
            case 'line': return {line: {linewidth: 2}};
            case 'ball-stick':
            default: return {stick: {radius: 0.1}, sphere: {scale: 0.25}};
        }
    }

    const styleSpec = getStyleSpec(opts.style);

    // Fetch and render
    fetch(fileUrl)
        .then(response => response.text())
        .then(data => {
            // Convert POSCAR to XYZ if needed
            let modelData = data;
            let modelFormat = opts.format;
            let poscarData = null;
            const originalFormat = opts.format;
            
            if (opts.format === 'poscar') {
                const result = poscarToXyz(data);
                modelData = result.xyz;
                poscarData = result.poscarData;
                modelFormat = 'xyz';
            }
            
            const viewer = $3Dmol.createViewer(`${containerId}_canvas`, {backgroundColor: opts.background});
            viewer.setProjection("orthographic");  // Use orthographic view (no perspective distortion)
            viewer.addModel(modelData, modelFormat);
            
            // Parse lattice from extended XYZ format
            let latticeVectors = null;
            const latticeMatch = modelData.match(/Lattice="([^"]+)"/);
            if (latticeMatch) {
                const vals = latticeMatch[1].split(/\s+/).map(parseFloat);
                if (vals.length >= 9) {
                    latticeVectors = {
                        a: [vals[0], vals[1], vals[2]],
                        b: [vals[3], vals[4], vals[5]],
                        c: [vals[6], vals[7], vals[8]]
                    };
                }
            }
            
            // First apply style to original model
            viewer.setStyle({}, styleSpec);
            
            // Show unit cell box BEFORE adding periodic images (uses model 0's crystal data)
            if (opts.showBox) {
                viewer.addUnitCell({box: {color: 'black'}, alabel: 'a', blabel: 'b', clabel: 'c'});
            }
            
            // Extend structure periodically in X, Y, and Z if requested
            if ((opts.extendX > 0 || opts.extendY > 0 || opts.extendZ > 0) && latticeVectors) {
                const va = latticeVectors.a;
                const vb = latticeVectors.b;
                const vc = latticeVectors.c;
                
                // Get all atoms from original model
                const model = viewer.getModel();
                const originalAtoms = model.selectedAtoms({});
                
                // Generate periodic images
                const images = [];
                
                // Calculate inverse matrix for 3D fractional coordinates
                const det = va[0] * (vb[1] * vc[2] - vb[2] * vc[1]) - 
                           va[1] * (vb[0] * vc[2] - vb[2] * vc[0]) + 
                           va[2] * (vb[0] * vc[1] - vb[1] * vc[0]);
                
                if (Math.abs(det) > 1e-10) {
                    // For each atom, check if it's near a cell boundary
                    for (const atom of originalAtoms) {
                        // Calculate 3D fractional coordinates
                        // fracA = (b x c) . r / det
                        const fracA = ((vb[1] * vc[2] - vb[2] * vc[1]) * atom.x + 
                                      (vb[2] * vc[0] - vb[0] * vc[2]) * atom.y + 
                                      (vb[0] * vc[1] - vb[1] * vc[0]) * atom.z) / det;
                        
                        // fracB = (c x a) . r / det
                        const fracB = ((vc[1] * va[2] - vc[2] * va[1]) * atom.x + 
                                      (vc[2] * va[0] - vc[0] * va[2]) * atom.y + 
                                      (vc[0] * va[1] - vc[1] * va[0]) * atom.z) / det;

                        // fracC = (a x b) . r / det
                        const fracC = ((va[1] * vb[2] - va[2] * vb[1]) * atom.x + 
                                      (va[2] * vb[0] - va[0] * vb[2]) * atom.y + 
                                      (va[0] * vb[1] - va[1] * vb[0]) * atom.z) / det;
                        
                        // Check each neighboring cell direction
                        const shifts = [];
                        
                        // Face neighbors (X, Y, Z directions)
                        if (opts.extendX > 0 && fracA < opts.extendX) shifts.push([1, 0, 0]);
                        if (opts.extendX > 0 && fracA > (1 - opts.extendX)) shifts.push([-1, 0, 0]);
                        if (opts.extendY > 0 && fracB < opts.extendY) shifts.push([0, 1, 0]);
                        if (opts.extendY > 0 && fracB > (1 - opts.extendY)) shifts.push([0, -1, 0]);
                        if (opts.extendZ > 0 && fracC < opts.extendZ) shifts.push([0, 0, 1]);
                        if (opts.extendZ > 0 && fracC > (1 - opts.extendZ)) shifts.push([0, 0, -1]);
                        
                        // Edge neighbors (combinations of 2 directions)
                        if (opts.extendX > 0 && opts.extendY > 0) {
                            if (fracA < opts.extendX && fracB < opts.extendY) shifts.push([1, 1, 0]);
                            if (fracA < opts.extendX && fracB > (1 - opts.extendY)) shifts.push([1, -1, 0]);
                            if (fracA > (1 - opts.extendX) && fracB < opts.extendY) shifts.push([-1, 1, 0]);
                            if (fracA > (1 - opts.extendX) && fracB > (1 - opts.extendY)) shifts.push([-1, -1, 0]);
                        }
                        if (opts.extendX > 0 && opts.extendZ > 0) {
                            if (fracA < opts.extendX && fracC < opts.extendZ) shifts.push([1, 0, 1]);
                            if (fracA < opts.extendX && fracC > (1 - opts.extendZ)) shifts.push([1, 0, -1]);
                            if (fracA > (1 - opts.extendX) && fracC < opts.extendZ) shifts.push([-1, 0, 1]);
                            if (fracA > (1 - opts.extendX) && fracC > (1 - opts.extendZ)) shifts.push([-1, 0, -1]);
                        }
                        if (opts.extendY > 0 && opts.extendZ > 0) {
                            if (fracB < opts.extendY && fracC < opts.extendZ) shifts.push([0, 1, 1]);
                            if (fracB < opts.extendY && fracC > (1 - opts.extendZ)) shifts.push([0, 1, -1]);
                            if (fracB > (1 - opts.extendY) && fracC < opts.extendZ) shifts.push([0, -1, 1]);
                            if (fracB > (1 - opts.extendY) && fracC > (1 - opts.extendZ)) shifts.push([0, -1, -1]);
                        }
                        
                        // Corner neighbors (all 3 directions)
                        if (opts.extendX > 0 && opts.extendY > 0 && opts.extendZ > 0) {
                            if (fracA < opts.extendX && fracB < opts.extendY && fracC < opts.extendZ) shifts.push([1, 1, 1]);
                            if (fracA < opts.extendX && fracB < opts.extendY && fracC > (1 - opts.extendZ)) shifts.push([1, 1, -1]);
                            if (fracA < opts.extendX && fracB > (1 - opts.extendY) && fracC < opts.extendZ) shifts.push([1, -1, 1]);
                            if (fracA < opts.extendX && fracB > (1 - opts.extendY) && fracC > (1 - opts.extendZ)) shifts.push([1, -1, -1]);
                            if (fracA > (1 - opts.extendX) && fracB < opts.extendY && fracC < opts.extendZ) shifts.push([-1, 1, 1]);
                            if (fracA > (1 - opts.extendX) && fracB < opts.extendY && fracC > (1 - opts.extendZ)) shifts.push([-1, 1, -1]);
                            if (fracA > (1 - opts.extendX) && fracB > (1 - opts.extendY) && fracC < opts.extendZ) shifts.push([-1, -1, 1]);
                            if (fracA > (1 - opts.extendX) && fracB > (1 - opts.extendY) && fracC > (1 - opts.extendZ)) shifts.push([-1, -1, -1]);
                        }
                        
                        for (const [ia, ib, ic] of shifts) {
                            images.push({
                                elem: atom.elem,
                                x: atom.x + ia * va[0] + ib * vb[0] + ic * vc[0],
                                y: atom.y + ia * va[1] + ib * vb[1] + ic * vc[1],
                                z: atom.z + ia * va[2] + ib * vb[2] + ic * vc[2]
                            });
                        }
                    }
                }
                
                // Add periodic images as new model
                if (images.length > 0) {
                    let periodicXyz = `${images.length}\nPeriodic images\n`;
                    for (const img of images) {
                        periodicXyz += `${img.elem} ${img.x.toFixed(6)} ${img.y.toFixed(6)} ${img.z.toFixed(6)}\n`;
                    }
                    viewer.addModel(periodicXyz, "xyz");
                    if (opts.fadeExtended) {
                        viewer.setStyle({model: -1}, {stick: {radius: 0.1, opacity: 0.5}, sphere: {scale: 0.25, opacity: 0.5}});
                    } else {
                        viewer.setStyle({model: -1}, styleSpec);
                    }
                }
            }
            
            // Show hydrogen bonds if enabled
            let hbondShapes = [];
            if (opts.showHbonds) {
                hbondShapes = drawHydrogenBonds(viewer, opts.hbondCutoff, new Set(), []);
            }

            // Click handler - support multi-selection with Shift key
            let selectedAtoms = new Set();
            const updateSelectionInfo = () => {
                const infoEl = document.getElementById(`${containerId}_selection_info`);
                if (infoEl) {
                    if (selectedAtoms.size > 0) {
                        infoEl.textContent = `Selected: ${selectedAtoms.size} atom(s)`;
                    } else {
                        infoEl.textContent = '';
                    }
                }
            };
            
            viewer.setClickable({}, true, function(atom, viewer, event) {
                const isShiftClick = event && event.shiftKey;
                
                if (isShiftClick) {
                    // Toggle selection for this atom
                    if (selectedAtoms.has(atom.serial)) {
                        selectedAtoms.delete(atom.serial);
                    } else {
                        selectedAtoms.add(atom.serial);
                    }
                } else {
                    // Single click - clear previous and select only this one
                    selectedAtoms.clear();
                    selectedAtoms.add(atom.serial);
                }
                
                // Update visualization
                viewer.setStyle({}, styleSpec);
                for (const serial of selectedAtoms) {
                    viewer.setStyle({serial: serial}, {stick: {radius: 0.1}, sphere: {scale: 0.25, color: 'green'}});
                }
                
                // Show atom info in fixed position at bottom-left
                const atomInfoEl = document.getElementById(`${containerId}_atom_info`);
                if (atomInfoEl) {
                    atomInfoEl.innerHTML = `#${atom.serial} ${atom.elem} (${atom.x.toFixed(2)}, ${atom.y.toFixed(2)}, ${atom.z.toFixed(2)}) Å`;
                    atomInfoEl.style.display = 'block';
                }
                
                updateSelectionInfo();
                viewer.render();
            });

            viewer.zoomTo();
            viewer.zoom(4.0 / opts.zoom);  // Apply zoom (larger zoom value = zoom out more)
            viewer.render();
            const defaultView = viewer.getView();
            
            // Will store the viewer object for setting initial view later
            let initialView = opts.view;
            
            // Use lattice vectors we already parsed from XYZ, or try to get from crystal data
            let latticeVecs = latticeVectors;  // Already parsed from Lattice="..." string
            if (!latticeVecs) {
                const model = viewer.getModel();
                if (model && model.getCrystData) {
                    const cryst = model.getCrystData();
                    if (cryst && cryst.a && cryst.b && cryst.c) {
                        // Crystal data available - calculate lattice vectors from parameters
                        const a = cryst.a, b = cryst.b, c = cryst.c;
                        const alpha = cryst.alpha * Math.PI / 180;
                        const beta = cryst.beta * Math.PI / 180;
                        const gamma = cryst.gamma * Math.PI / 180;
                        
                        // Build lattice vectors
                        const va = [a, 0, 0];
                        const vb = [b * Math.cos(gamma), b * Math.sin(gamma), 0];
                        const cx = c * Math.cos(beta);
                        const cy = c * (Math.cos(alpha) - Math.cos(beta) * Math.cos(gamma)) / Math.sin(gamma);
                        const cz = Math.sqrt(c * c - cx * cx - cy * cy);
                        const vc = [cx, cy, cz];
                        
                        latticeVecs = {a: va, b: vb, c: vc};
                    }
                }
            }

            // Store viewer with helper methods
            window.molViewers[containerId] = {
                viewer: viewer,
                defaultView: defaultView,
                styleSpec: styleSpec,
                latticeVecs: latticeVecs,
                selectedAtoms: selectedAtoms,
                deletedSerials: new Set(),
                latticeString: latticeMatch ? latticeMatch[1] : null,
                containerId: containerId,
                showHbonds: opts.showHbonds,
                hbondCutoff: opts.hbondCutoff,
                hbondShapes: hbondShapes,
                originalFormat: originalFormat,
                poscarData: poscarData,
                setView: function(direction) {
                    const v = this.viewer;
                    const lv = this.latticeVecs;
                    
                    // Reset to default first
                    v.setView(this.defaultView);
                    
                    if (direction === 'reset') {
                        v.render();
                        return;
                    }
                    
                    // Calculate rotation angle in XY plane for b vector
                    // b vector angle from Y axis
                    let bAngle = 0;
                    if (lv) {
                        bAngle = Math.atan2(lv.b[0], lv.b[1]) * 180 / Math.PI;
                    }
                    
                    // Calculate angle of a vector from X axis
                    let aAngle = 0;
                    if (lv) {
                        aAngle = Math.atan2(lv.a[1], lv.a[0]) * 180 / Math.PI;
                    }
                    
                    switch(direction) {
                        case 'top':    
                            // Looking down -c (from above), no rotation needed
                            // Just make sure a-axis points right
                            v.rotate(-aAngle, {x:0, y:0, z:1});
                            break;
                        case 'bottom': 
                            // Looking up +c (from below)
                            v.rotate(180, {x:1, y:0, z:0});
                            v.rotate(aAngle, {x:0, y:0, z:1});
                            break;
                        case 'front':  
                            // Looking along +b: tilt back so c points up
                            v.rotate(-90, {x:1, y:0, z:0});  // Tilt back, now c points up
                            v.rotate(180 + bAngle, {x:0, y:0, z:1}); // Rotate to look along +b
                            break;
                        case 'back':   
                            // Looking along -b: tilt back so c points up
                            v.rotate(-90, {x:1, y:0, z:0}); // Tilt back, now c points up
                            v.rotate(bAngle, {x:0, y:0, z:1}); // Rotate to align with -b
                            break;
                        case 'left':   
                            // Looking along +a: c points up
                            v.rotate(-90, {x:1, y:0, z:0});  // Tilt back, c points up
                            v.rotate(90, {x:0, y:0, z:1}); // Turn to face +X
                            v.rotate(-aAngle, {x:0, y:0, z:1}); // Adjust for a angle
                            break;
                        case 'right':  
                            // Looking along -a: c points up
                            v.rotate(-90, {x:1, y:0, z:0});  // Tilt back, c points up
                            v.rotate(-90, {x:0, y:0, z:1});  // Turn to face -X
                            v.rotate(aAngle, {x:0, y:0, z:1}); // Adjust for a angle
                            break;
                    }
                    
                    v.render();
                },
                clearSelection: function() {
                    this.selectedAtoms.clear();
                    this.viewer.setStyle({}, this.styleSpec);
                    // Re-hide deleted atoms
                    for (const serial of this.deletedSerials) {
                        this.viewer.setStyle({serial: serial}, {hidden: true});
                    }
                    const infoEl = document.getElementById(`${this.containerId}_selection_info`);
                    if (infoEl) infoEl.textContent = '';
                    const atomInfoEl = document.getElementById(`${this.containerId}_atom_info`);
                    if (atomInfoEl) atomInfoEl.style.display = 'none';
                    this.viewer.render();
                },
                deleteSelected: function() {
                    if (this.selectedAtoms.size === 0) {
                        return;
                    }
                    
                    const count = this.selectedAtoms.size;
                    
                    // Mark atoms as deleted and hide them
                    for (const serial of this.selectedAtoms) {
                        this.deletedSerials.add(serial);
                        this.viewer.setStyle({serial: serial}, {hidden: true});
                    }
                    
                    // Recalculate H-bonds if enabled
                    if (this.showHbonds) {
                        this.hbondShapes = drawHydrogenBonds(this.viewer, this.hbondCutoff, this.deletedSerials, this.hbondShapes);
                    }
                    
                    // Re-hide deleted atoms (in case H-bond drawing affected styles)
                    for (const serial of this.deletedSerials) {
                        this.viewer.setStyle({serial: serial}, {hidden: true});
                    }
                    
                    // Clear selection
                    this.selectedAtoms.clear();
                    this.viewer.removeAllLabels();
                    const infoEl = document.getElementById(`${this.containerId}_selection_info`);
                    if (infoEl) infoEl.textContent = `Deleted ${count} atom(s). Total deleted: ${this.deletedSerials.size}`;
                    this.viewer.render();
                },
                saveStructure: function() {
                    // Get all atoms from model 0 (original structure, not periodic images)
                    const model = this.viewer.getModel(0);
                    const allAtoms = model.selectedAtoms({});
                    
                    // Filter out deleted atoms, keeping track of original indices
                    const remainingAtoms = [];
                    const remainingIndices = [];
                    for (let i = 0; i < allAtoms.length; i++) {
                        if (!this.deletedSerials.has(allAtoms[i].serial)) {
                            remainingAtoms.push(allAtoms[i]);
                            remainingIndices.push(i);
                        }
                    }
                    
                    if (remainingAtoms.length === 0) {
                        alert('No atoms remaining to save!');
                        return;
                    }
                    
                    let content, filename;
                    
                    if (this.originalFormat === 'poscar' && this.poscarData) {
                        // Save as POSCAR format
                        const pd = this.poscarData;
                        
                        // Group remaining atoms by element
                        const elementGroups = {};
                        for (let i = 0; i < remainingAtoms.length; i++) {
                            const origIdx = remainingIndices[i];
                            const elem = pd.atomElements[origIdx];
                            if (!elementGroups[elem]) {
                                elementGroups[elem] = [];
                            }
                            elementGroups[elem].push({
                                fracPos: pd.fractionalPositions[origIdx],
                                flags: pd.selectiveFlags[origIdx]
                            });
                        }
                        
                        // Build new element list and counts
                        const newElements = [];
                        const newCounts = [];
                        const orderedAtoms = [];
                        
                        // Preserve original element order
                        for (const elem of pd.elements) {
                            if (elementGroups[elem] && elementGroups[elem].length > 0) {
                                newElements.push(elem);
                                newCounts.push(elementGroups[elem].length);
                                orderedAtoms.push(...elementGroups[elem]);
                            }
                        }
                        
                        // Build POSCAR content
                        content = `${pd.comment} (modified)\n`;
                        content += `1.0\n`;  // Scale factor (lattice already scaled)
                        
                        // Lattice vectors
                        for (const vec of pd.lattice) {
                            content += `  ${vec[0].toFixed(10)}  ${vec[1].toFixed(10)}  ${vec[2].toFixed(10)}\n`;
                        }
                        
                        // Elements and counts
                        content += `  ${newElements.join('  ')}\n`;
                        content += `  ${newCounts.join('  ')}\n`;
                        
                        // Selective dynamics if original had it
                        if (pd.selectiveDynamics) {
                            content += `Selective dynamics\n`;
                        }
                        
                        content += `Direct\n`;
                        
                        // Atom positions
                        for (const atom of orderedAtoms) {
                            const [fx, fy, fz] = atom.fracPos;
                            if (pd.selectiveDynamics) {
                                const [f1, f2, f3] = atom.flags;
                                content += `  ${fx.toFixed(10)}  ${fy.toFixed(10)}  ${fz.toFixed(10)}  ${f1}  ${f2}  ${f3}\n`;
                            } else {
                                content += `  ${fx.toFixed(10)}  ${fy.toFixed(10)}  ${fz.toFixed(10)}\n`;
                            }
                        }
                        
                        filename = 'POSCAR_modified';
                    } else {
                        // Save as XYZ format
                        content = `${remainingAtoms.length}\n`;
                        
                        // Add lattice info if available
                        if (this.latticeString) {
                            content += `Lattice="${this.latticeString}" Properties=species:S:1:pos:R:3 pbc="T T T"\n`;
                        } else {
                            content += `Modified structure\n`;
                        }
                        
                        for (const atom of remainingAtoms) {
                            content += `${atom.elem} ${atom.x.toFixed(8)} ${atom.y.toFixed(8)} ${atom.z.toFixed(8)}\n`;
                        }
                        
                        filename = 'structure_modified.xyz';
                    }
                    
                    // Create download
                    const blob = new Blob([content], {type: 'text/plain'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            };
            
            // Apply initial view if specified
            if (initialView) {
                // Map crystallographic notation to internal view names
                const viewMap = {
                    'c': 'top',
                    'c*': 'bottom',
                    'b': 'front',
                    'b*': 'back',
                    'a': 'right',
                    'a*': 'left'
                };
                const mappedView = viewMap[initialView];
                if (mappedView) {
                    window.molViewers[containerId].setView(mappedView);
                }
            }
        });
}
