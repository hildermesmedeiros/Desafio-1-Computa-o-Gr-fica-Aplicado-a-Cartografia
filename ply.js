function point3D(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
}

function Model(vertices, vertexNormals, faces)
{
    this.vertices = vertices;
    this.normals = vertexNormals;
    this.faces = faces;
}

function ply_reader(data) {
    var hasNormal = false;
    
    // Read header
    while(data.length)
    {
        var retval = data.match(/.*/);
        var str = retval[0];
        data = data.substr(str.length+1);
        var retval = str.match(/element (\w+) (\d+)/);
        if(retval)
        {
            if(retval[1] == "vertex")
                var npoints = parseInt(retval[2]);
            if(retval[1] == "face")
                var npolys = parseInt(retval[2]);
        }
        if(str == "property float nx")
            hasNormal = true;
        if(str == "end_header")
            break;
    }
    
    // Read points
    var minPoint = new point3D(Infinity, Infinity, Infinity);
    var maxPoint = new point3D(-Infinity, -Infinity, -Infinity);
    var vertices = [];
    var vertexNormals = [];
    for (var i = 0; i < npoints; i++)
    {
        var retval = data.match(/([\d.-]+ ?)+/);
        var str = retval[0];
        data = data.substr(str.length+1);
        var retval = str.match(/([\d.-]+)/g);
        var point = new point3D(parseFloat(retval[0]), parseFloat(retval[1]), parseFloat(retval[2]));
        vertices.push(point.x, point.y, point.z);
        if(hasNormal)
            vertexNormals.push(parseFloat(retval[3]), parseFloat(retval[4]), parseFloat(retval[5]));
        minPoint.x = Math.min(minPoint.x, point.x);
        minPoint.y = Math.min(minPoint.y, point.y);
        minPoint.z = Math.min(minPoint.z, point.z);
        maxPoint.x = Math.max(maxPoint.x, point.x);
        maxPoint.y = Math.max(maxPoint.y, point.y);
        maxPoint.z = Math.max(maxPoint.z, point.z);
    }
    
    // Polygons
    var polys = [];
    var index = 0;
    for (var i = 0; i < npolys; i++)
    {
        var retval = data.match(/(\d+ ?)+/);
        var str = retval[0];
        data = data.substr(str.length+1);
        
        var retval = str.match(/(\d+)/g);
        var nvertex = parseInt(retval[0]);
        var aIndex = parseInt(retval[1]);
        var bIndex = parseInt(retval[2]);
        var cIndex = parseInt(retval[3]);
        if(nvertex == 3 || nvertex == 4)
        {
            polys.push(aIndex, bIndex, cIndex);
        }
        if(nvertex == 4)
        {
            var dIndex = parseInt(retval[4]);
            polys.push(aIndex, cIndex, dIndex);
        }
    }
    
    // Move to center of object
    var centerMove = new point3D(-(maxPoint.x + minPoint.x)/2, -(maxPoint.y + minPoint.y)/2, -(maxPoint.z + minPoint.z)/2);
    var scaleY = (maxPoint.y - minPoint.y) / 2;
    for (var i = 0; i < vertices.length; i+=3)
    {
        vertices[i+0] += centerMove.x;
        vertices[i+1] += centerMove.y;
        vertices[i+2] += centerMove.z;
        vertices[i+0] /= scaleY;
        vertices[i+1] /= scaleY;
        vertices[i+2] /= scaleY;
    }
    
    // Create model
    model = new Model(vertices, vertexNormals, polys);
    
    // Return moving to center model
    return model;
}
