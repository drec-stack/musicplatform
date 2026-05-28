require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const NodeID3 = require('node-id3');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '..')));

let db;
(async () => {
    const fs = require('fs');
    const dir = path.join(__dirname, 'storage');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    db = await open({
        filename: path.join(dir, 'musichub.db'),
        driver: sqlite3.Database
    });
    
    await db.exec(`
        CREATE TABLE IF NOT EXISTS tracks (
            id TEXT PRIMARY KEY,
            title TEXT,
            artist TEXT,
            album TEXT,
            duration INTEGER,
            source TEXT,
            file_path TEXT,
            play_count INTEGER DEFAULT 0,
            date_added INTEGER,
            cover_url TEXT
        );
        CREATE TABLE IF NOT EXISTS playlists (
            id TEXT PRIMARY KEY,
            name TEXT,
            description TEXT,
            tracks TEXT,
            created INTEGER,
            modified INTEGER
        );
    `);
    console.log('Database ready');
})();

const uploadDir = path.join(__dirname, 'storage/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

// API Routes
app.post('/api/upload', upload.single('audio'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'No file' });
        
        const tags = NodeID3.read(file.path);
        const id = Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
        
        const track = {
            id,
            title: tags.title || path.basename(file.originalname, path.extname(file.originalname)),
            artist: tags.artist || 'Unknown',
            album: tags.album || '',
            duration: tags.length?.raw || 0,
            source: 'local',
            file_path: file.path,
            play_count: 0,
            date_added: Date.now()
        };
        
        await db.run(`
            INSERT INTO tracks (id, title, artist, album, duration, source, file_path, play_count, date_added)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [track.id, track.title, track.artist, track.album, track.duration, track.source, track.file_path, track.play_count, track.date_added]);
        
        res.json(track);
    } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/tracks', async (req, res) => {
    const tracks = await db.all('SELECT * FROM tracks ORDER BY date_added DESC');
    res.json(tracks);
});

app.get('/api/tracks/:id/stream', async (req, res) => {
    const track = await db.get('SELECT * FROM tracks WHERE id = ?', [req.params.id]);
    if (!track || !track.file_path || !fs.existsSync(track.file_path)) {
        return res.status(404).json({ error: 'Not found' });
    }
    const stat = fs.statSync(track.file_path);
    const range = req.headers.range;
    
    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': (end - start) + 1,
            'Content-Type': 'audio/mpeg',
        });
        fs.createReadStream(track.file_path, { start, end }).pipe(res);
    } else {
        res.writeHead(200, {
            'Content-Length': stat.size,
            'Content-Type': 'audio/mpeg',
        });
        fs.createReadStream(track.file_path).pipe(res);
    }
    await db.run('UPDATE tracks SET play_count = play_count + 1 WHERE id = ?', [track.id]);
});

app.delete('/api/tracks/:id', async (req, res) => {
    const track = await db.get('SELECT file_path FROM tracks WHERE id = ?', [req.params.id]);
    if (track && track.file_path && fs.existsSync(track.file_path)) fs.unlinkSync(track.file_path);
    await db.run('DELETE FROM tracks WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

app.get('/api/playlists', async (req, res) => {
    const playlists = await db.all('SELECT * FROM playlists');
    res.json(playlists);
});

app.post('/api/playlists', async (req, res) => {
    const { name, description } = req.body;
    const id = Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
    await db.run(`
        INSERT INTO playlists (id, name, description, tracks, created, modified)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [id, name, description || '', JSON.stringify([]), Date.now(), Date.now()]);
    res.json({ id, name, description, tracks: [] });
});

app.post('/api/playlists/:id/tracks', async (req, res) => {
    const { trackId } = req.body;
    const pl = await db.get('SELECT * FROM playlists WHERE id = ?', [req.params.id]);
    if (!pl) return res.status(404).json({ error: 'Not found' });
    let tracks = JSON.parse(pl.tracks || '[]');
    if (!tracks.includes(trackId)) tracks.push(trackId);
    await db.run('UPDATE playlists SET tracks = ?, modified = ? WHERE id = ?', [JSON.stringify(tracks), Date.now(), req.params.id]);
    res.json({ success: true });
});

app.delete('/api/playlists/:id/tracks/:trackId', async (req, res) => {
    const pl = await db.get('SELECT * FROM playlists WHERE id = ?', [req.params.id]);
    if (!pl) return res.status(404).json({ error: 'Not found' });
    let tracks = JSON.parse(pl.tracks || '[]');
    tracks = tracks.filter(t => t !== req.params.trackId);
    await db.run('UPDATE playlists SET tracks = ?, modified = ? WHERE id = ?', [JSON.stringify(tracks), Date.now(), req.params.id]);
    res.json({ success: true });
});

app.delete('/api/playlists/:id', async (req, res) => {
    await db.run('DELETE FROM playlists WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const tracks = await db.all(`
        SELECT * FROM tracks WHERE title LIKE ? OR artist LIKE ? OR album LIKE ? LIMIT 50
    `, [`%${q}%`, `%${q}%`, `%${q}%`]);
    res.json(tracks);
});

app.get('/api/stats', async (req, res) => {
    const trackCount = await db.get('SELECT COUNT(*) as count FROM tracks');
    const playlistCount = await db.get('SELECT COUNT(*) as count FROM playlists');
    res.json({ totalTracks: trackCount.count, totalPlaylists: playlistCount.count });
});

app.get('*', (req, res) => { res.sendFile(path.join(__dirname, '..', 'index.html')); });

app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
