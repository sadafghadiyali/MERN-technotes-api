const User = require("../models/User");
const Note = require("../models/Note");
const AsyncHandler = require("express-async-handler");

const getAllNotes = AsyncHandler(async (req, res) => {
  const notes = await Note.find().lean();
  if (!notes?.length) {
    return res.status(400).json({ message: "No notes found" });
  }

  const notesWithUser = await Promise.all(
    notes.map(async (note) => {
      const user = await User.findById(note.user).lean().exec();
      return { ...note, username: user.username };
    })
  );
  res.json(notesWithUser);
});

const createNewNote = AsyncHandler(async (req, res) => {
  const { title, text, user } = req.body;

  if (!user || !title || !text) {
    return res.status(400).json({ message: "All fields are required" });
  }

  //exec() returns exactly a promise. If you dont use exec, the findOne fn will not return a promise, but you can use await and then() with it
  const duplicate = await Note.findOne({ title })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate note title" });
  }

  const noteObj = { user, title, text };

  const note = await Note.create(noteObj);

  if (note) {
    return res.status(201).json({ message: `New note created` });
  } else {
    return res.status(400).json({ message: "Invalid note data received" });
  }
});

const updateNote = AsyncHandler(async (req, res) => {
  const { id, user, title, text, completed } = req.body;

  if (!id || !user || !text || typeof completed !== "boolean") {
    return res.status(400).json({ message: "All fields are required" });
  }

  const note = await Note.findById(id).exec();

  if (!note) {
    return res.status(400).json({ message: "Note not found" });
  }

  const duplicate = await Note.findOne({ title })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate note title" });
  }

  note.user = user;
  note.title = title;
  note.text = text;
  note.completed = completed;

  const updatedNote = await note.save();

  if (updatedNote) {
    return res.status(200).json({ message: `${updatedNote.title} updated` });
  }
});

const deleteNote = AsyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Note ID required" });
  }

  const note = await Note.findById(id).exec();

  if (!note) {
    return res.status(400).json({ message: "Note not found" });
  }

  const result = await note.deleteOne();

  res.json(`Note ${result.title} with ID ${result._id} deleted`);
});

module.exports = { getAllNotes, createNewNote, updateNote, deleteNote };
