/**
 * Course progress for The Rebuilding Room (localStorage).
 * Progress: completed rooms, reflections, access order, last opened.
 * Migrates legacy keys: rr_unlocked_up_to, rr_room_{n}_reflections
 */
(function (global) {
  var KEY = "rr_course_progress";
  var LEGACY_UNLOCK = "rr_unlocked_up_to";
  var LEGACY_PREFIX = "rr_room_";
  var ROOM_TITLES = ["", "Acceptance", "Identity", "Control", "Confidence", "Direction", "Rebuild"];

  function emptyState() {
    return {
      v: 1,
      completedRoomIds: [],
      unlockedUpTo: 1,
      lastOpenedRoomId: null,
      reflections: {},
    };
  }

  function clearLegacyStorage() {
    try {
      localStorage.removeItem(LEGACY_UNLOCK);
      for (var i = 1; i <= 6; i++) {
        localStorage.removeItem(LEGACY_PREFIX + i + "_reflections");
      }
    } catch (e) {
      /* ignore */
    }
  }

  function importLegacy() {
    var p = emptyState();
    var found = false;
    var u = parseInt(localStorage.getItem(LEGACY_UNLOCK), 10);
    if (Number.isFinite(u) && u >= 1) {
      p.unlockedUpTo = Math.min(6, Math.max(1, u));
      found = true;
    }
    for (var i = 1; i <= 6; i++) {
      var lk = LEGACY_PREFIX + i + "_reflections";
      var raw = localStorage.getItem(lk);
      if (!raw) {
        continue;
      }
      found = true;
      try {
        var o = JSON.parse(raw);
        p.reflections[String(i)] = {
          r1: typeof o.r1 === "string" ? o.r1 : "",
          r2: typeof o.r2 === "string" ? o.r2 : "",
          r3: typeof o.r3 === "string" ? o.r3 : "",
        };
      } catch (err) {
        /* skip */
      }
    }
    return found ? p : null;
  }

  function normalize(raw) {
    var base = emptyState();
    if (!raw || typeof raw !== "object") {
      return base;
    }
    if (Array.isArray(raw.completedRoomIds)) {
      base.completedRoomIds = raw.completedRoomIds
        .map(function (n) {
          return parseInt(n, 10);
        })
        .filter(function (n) {
          return n >= 1 && n <= 6;
        })
        .filter(function (n, idx, arr) {
          return arr.indexOf(n) === idx;
        })
        .sort(function (a, b) {
          return a - b;
        });
    }
    var u = parseInt(raw.unlockedUpTo, 10);
    base.unlockedUpTo = Number.isFinite(u) ? Math.min(6, Math.max(1, u)) : 1;
    var lo = parseInt(raw.lastOpenedRoomId, 10);
    base.lastOpenedRoomId =
      Number.isFinite(lo) && lo >= 1 && lo <= 6 ? lo : null;
    if (raw.reflections && typeof raw.reflections === "object") {
      base.reflections = raw.reflections;
    }
    var maxC = 0;
    if (base.completedRoomIds.length) {
      maxC = Math.max.apply(null, base.completedRoomIds);
    }
    var fromCompleted = Math.min(6, maxC + 1);
    base.unlockedUpTo = Math.max(base.unlockedUpTo, fromCompleted);
    return base;
  }

  function write(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function load() {
    var raw = localStorage.getItem(KEY);
    if (!raw) {
      var legacy = importLegacy();
      if (legacy) {
        var migrated = normalize(legacy);
        write(migrated);
        clearLegacyStorage();
        return migrated;
      }
      var fresh = emptyState();
      write(fresh);
      return fresh;
    }
    clearLegacyStorage();
    try {
      return normalize(JSON.parse(raw));
    } catch (err) {
      var reset = emptyState();
      write(reset);
      return reset;
    }
  }

  function getReflections(roomId) {
    var p = load();
    var block = p.reflections[String(roomId)];
    if (!block || typeof block !== "object") {
      return { r1: "", r2: "", r3: "", r4: "", r5: "", forward: "", anchor: "", nurture: "" };
    }
    return {
      r1: typeof block.r1 === "string" ? block.r1 : "",
      r2: typeof block.r2 === "string" ? block.r2 : "",
      r3: typeof block.r3 === "string" ? block.r3 : "",
      r4: typeof block.r4 === "string" ? block.r4 : "",
      r5: typeof block.r5 === "string" ? block.r5 : "",
      forward: typeof block.forward === "string" ? block.forward : "",
      anchor: typeof block.anchor === "string" ? block.anchor : "",
      nurture: typeof block.nurture === "string" ? block.nurture : "",
    };
  }

  function buildReflectionsExportText() {
    var p = load();
    var lines = [];
    lines.push("THE REBUILDING ROOM - MY REFLECTIONS");
    lines.push("Exported: " + new Date().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }));
    lines.push("");
    for (var i = 1; i <= 6; i++) {
      lines.push("----------------------------------------");
      lines.push("Room " + i + " - " + ROOM_TITLES[i]);
      lines.push("");
      var r = p.reflections[String(i)];
      if (!r || typeof r !== "object") {
        r = { r1: "", r2: "", r3: "", r4: "", r5: "", forward: "", anchor: "", nurture: "" };
      }
      lines.push("Reflection 1");
      lines.push(String(r.r1 || "").trim() || "(not written)");
      lines.push("");
      lines.push("Reflection 2");
      lines.push(String(r.r2 || "").trim() || "(not written)");
      lines.push("");
      lines.push("Reflection 3");
      lines.push(String(r.r3 || "").trim() || "(not written)");
      lines.push("");
      if (String(r.r4 || "").trim()) {
        lines.push("Reflection 4");
        lines.push(String(r.r4 || "").trim());
        lines.push("");
      }
      if (String(r.r5 || "").trim()) {
        lines.push("Reflection 5");
        lines.push(String(r.r5 || "").trim());
        lines.push("");
      }
      if (String(r.forward || "").trim()) {
        lines.push("A small move forward");
        lines.push(String(r.forward || "").trim());
        lines.push("");
      }
      if (String(r.anchor || "").trim()) {
        lines.push("Anchor sentence");
        lines.push(String(r.anchor || "").trim());
        lines.push("");
      }
      if (String(r.nurture || "").trim()) {
        lines.push("Nurture");
        lines.push(String(r.nurture || "").trim());
        lines.push("");
      }
    }
    return lines.join("\n");
  }

  global.RRCourseProgress = {
    load: load,

    isRoomUnlocked: function (roomId) {
      var p = load();
      return roomId <= p.unlockedUpTo;
    },

    isRoomCompleted: function (roomId) {
      var p = load();
      return p.completedRoomIds.indexOf(roomId) !== -1;
    },

    hasCompletedCourse: function () {
      var p = load();
      return p.completedRoomIds.indexOf(6) !== -1;
    },

    getReflectionsExportText: function () {
      return buildReflectionsExportText();
    },

    getReflections: getReflections,

    saveReflections: function (roomId, payload) {
      var p = load();
      var prior = p.reflections[String(roomId)];
      if (!prior || typeof prior !== "object") {
        prior = {};
      }
      p.reflections[String(roomId)] = {
        r1: payload && typeof payload.r1 === "string" ? payload.r1 : typeof prior.r1 === "string" ? prior.r1 : "",
        r2: payload && typeof payload.r2 === "string" ? payload.r2 : typeof prior.r2 === "string" ? prior.r2 : "",
        r3: payload && typeof payload.r3 === "string" ? payload.r3 : typeof prior.r3 === "string" ? prior.r3 : "",
        r4: payload && typeof payload.r4 === "string" ? payload.r4 : typeof prior.r4 === "string" ? prior.r4 : "",
        r5: payload && typeof payload.r5 === "string" ? payload.r5 : typeof prior.r5 === "string" ? prior.r5 : "",
        forward:
          payload && typeof payload.forward === "string"
            ? payload.forward
            : typeof prior.forward === "string"
              ? prior.forward
              : "",
        anchor: payload && typeof payload.anchor === "string" ? payload.anchor : typeof prior.anchor === "string" ? prior.anchor : "",
        nurture: payload && typeof payload.nurture === "string" ? payload.nurture : typeof prior.nurture === "string" ? prior.nurture : "",
      };
      write(p);
    },

    setLastOpenedRoom: function (roomId) {
      var p = load();
      p.lastOpenedRoomId = roomId;
      write(p);
    },

    completeRoom: function (roomId) {
      var p = load();
      if (p.completedRoomIds.indexOf(roomId) === -1) {
        p.completedRoomIds.push(roomId);
        p.completedRoomIds.sort(function (a, b) {
          return a - b;
        });
      }
      p.unlockedUpTo = Math.max(p.unlockedUpTo, Math.min(6, roomId + 1));
      write(p);
      return p;
    },
  };
})(typeof window !== "undefined" ? window : this);
