const JsonReader = require("./JsonReader.js");
const StringReader = require("./StringReader.js");

class Reader {
    jsonReader;
    stringReader;

    Reader(s) {
        this.stringReader = new StringReader(s);
        this.jsonReader = new JsonReader(stringReader);
    }

    getName() {
        return jsonReader.nextName();
    }

    getString() {
        return jsonReader.nextString();
    }

    getNull() {
        jsonReader.nextNull();
        return null;
    }

    beginObject() {
        jsonReader.beginObject();
        return this;
    }

    endObject() {
        jsonReader.endObject();
        return this;
    }

    beginArray() {
        jsonReader.beginArray();
        return this;
    }

    endArray() {
        jsonReader.endArray();
        return this;
    }

    deserialize(key, classname) {
        if(key != null) {
            nextKey = getName();
            if(!key.equals(nextKey)) {
                // Expected key was not found.
                //throw new IllegalStateException("class = " + clazzT.getSimpleName() + " key = " + key + " nextKey = " + nextKey);
            }
        }

        if(jsonReader.peek() == JsonToken.NULL) {
            return getNull();
        }
        else {
            wrappedClass = wrapSerializableClass(clazzT);
            return ReflectUtil.callStaticMethod(wrappedClass, "deserializeFromJSON", this);
        }
    }

    deserializeArray(key, classname) {
        if(key != null) {
            nextKey = getName();
            if(!key.equals(nextKey)) {
                // Expected key was not found.
                //throw new IllegalStateException("class = " + clazzT.getSimpleName() + " key = " + key + " nextKey = " + nextKey);
            }
        }

        if(jsonReader.peek() == JsonToken.NULL) {
            return getNull();
        }
        else {
            arrayList = new ArrayList();

            jsonReader.beginArray();
            while(jsonReader.hasNext()) {
                arrayList.add(deserialize(null, clazzT));
            }
            jsonReader.endArray();

            // Give an empty array as the input to ensure we return the right type.
            return arrayList.toArray(Array.newInstance(clazzT, 0));
        }
    }

    deserializeArrayList(key, classname) {
        if(key != null) {
            nextKey = getName();
            if(!key.equals(nextKey)) {
                // Expected key was not found.
                //throw new IllegalStateException("class = " + clazzT.getSimpleName() + " key = " + key + " nextKey = " + nextKey);
            }
        }

        if(jsonReader.peek() == JsonToken.NULL) {
            return getNull();
        }
        else {
            arrayList = new ArrayList();

            jsonReader.beginArray();
            while(jsonReader.hasNext()) {
                arrayList.add(deserialize(null, clazzT));
            }
            jsonReader.endArray();

            return arrayList;
        }
    }

    deserializeHashMap(key, classnameA, classnameB) {
        if(key != null) {
            nextKey = getName();
            if(!key.equals(nextKey)) {
                // Expected key was not found.
                //throw new IllegalStateException("class = " + clazzT.getSimpleName() + " key = " + key + " nextKey = " + nextKey);
            }
        }

        if(jsonReader.peek() == JsonToken.NULL) {
            return getNull();
        }
        else {
            jsonReader.beginObject();
            arrayListT = deserializeArrayList("keys", clazzT);
            arrayListU = deserializeArrayList("values", clazzU);
            jsonReader.endObject();

            if(arrayListT == null || arrayListU == null || arrayListT.size() != arrayListU.size()) {
                return null;
            }

            hashMap = new HashMap();
            for(let i = 0; i < arrayListT.size(); i++) {
                hashMap.put(arrayListT.get(i), arrayListU.get(i));
            }

            return hashMap;
        }
    }
}