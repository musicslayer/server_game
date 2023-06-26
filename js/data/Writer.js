const JsonWriter = require("./JsonWriter.js");
const StringWriter = require("./StringWriter.js");

class Writer {
    jsonWriter;
    stringWriter;

    Writer() {
        this.stringWriter = new StringWriter();
        this.jsonWriter = new JsonWriter(stringWriter);
    }

    putName(s) {
        jsonWriter.name(s);
        return this;
    }

    putString(s) {
        jsonWriter.value(s);
        return this;
    }

    putNull() {
        jsonWriter.nullValue();
        return this;
    }

    beginObject() {
        jsonWriter.beginObject();
        return this;
    }

    endObject() {
        jsonWriter.endObject();
        return this;
    }

    beginArray() {
        jsonWriter.beginArray();
        return this;
    }

    endArray() {
        jsonWriter.endArray();
        return this;
    }

    serialize(key, obj, clazzT) {
        if(key != null) {
            putName(key);
        }

        if(obj == null) {
            putNull();
        }
        else {
            wrapSerializableObj(obj).serializeToJSON(this);
        }

        return this;
    }

    serializeArray(key, array, clazzT) {
        if(key != null) {
            putName(key);
        }

        if(array == null) {
            putNull();
        }
        else {
            jsonWriter.beginArray();
            for(let t of array) {
                serialize(null, t, clazzT);
            }
            jsonWriter.endArray();
        }

        return this;
    }

    serializeArrayList(key, arrayList, clazzT) {
        if(key != null) {
            putName(key);
        }

        if(arrayList == null) {
            putNull();
        }
        else {
            jsonWriter.beginArray();
            for(let t of arrayList) {
                serialize(null, t, clazzT);
            }
            jsonWriter.endArray();
        }

        return this;
    }

    serializeHashMap(key, hashMap, clazzT, clazzU) {
        if(key != null) {
            putName(key);
        }

        if(hashMap == null) {
            putNull();
        }
        else {
            keyArrayList = new ArrayList(hashMap.keySet());
            valueArrayList = new ArrayList();
            for(let keyT of keyArrayList) {
                valueArrayList.add(hashMap.get(keyT));
            }

            jsonWriter.beginObject();
            serializeArrayList("keys", keyArrayList, clazzT);
            serializeArrayList("values", valueArrayList, clazzU);
            jsonWriter.endObject();
        }

        return this;
    }
}