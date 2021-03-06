/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an 'AS IS' basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is DoctorJS.
 *
 * The Initial Developer of the Original Code is
 * Dave Herman <dherman@mozilla.com>
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Dave Herman <dherman@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

function Entry() {
    this.pending = true;
    this.listeners = [];
    this.err = null;
    this.result = null;

    // hard-bind |this| for convenient use as a callback
    var self = this;
    this.ready = function ready(err, result) {
        if (!self.pending)
            return;
        self.pending = false;
        if (err) {
            self.err = err;
            self.listeners.forEach(function(cb) {
                cb(err, null);
            });
            self.listeners = null;
        } else {
            self.result = result;
            self.listeners.forEach(function(cb) {
                cb(null, result);
            });
        }
    };
}

Entry.prototype = {
    onready: function(cb) {
        if (this.pending)
            this.listeners.push(cb);
        else
            cb(this.err, this.err ? null : this.result);
    }
};

function Memo() {
    this.table = Object.create(null, {});
}

Memo.prototype = {
    has: function(key) {
        return key in this.table;
    },
    memo: function(key, onadd) {
        var entry = this.table[key];
        if (!entry) {
            entry = this.add(key);
            onadd(entry);
        }
        return entry;
    },
    memoSync: function(key, onadd) {
        var entry = this.table[key];
        if (!entry) {
            var result = onadd();
            entry = this.add(key);
            entry.pending = false;
            entry.result = result;
            return result;
        }
        if (entry.pending)
            throw new Error("async entry");
        if (entry.err)
            throw entry.err;
        return entry.result;
    },
    add: function(key) {
        if (this.table[key])
            throw new Error("already has an entry for " + key);
        return (this.table[key] = new Entry(key));
    }
};

exports.Memo = Memo;
