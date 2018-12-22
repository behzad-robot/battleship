import mongoose from 'mongoose';

export const GameSchema = new mongoose.Schema({
    users : Array,
    players : Array,
    turn : String,
    winner : String,
    boards : Array,
    logs: Array,
    createdAt : String,
    updatedAt : String,
});
export const Game = mongoose.model('Game', GameSchema);
Game.Helpers = {
    public: (doc) =>
    {
        return doc;
    },
    fields: () =>
    {
        var fields = Object.keys(GameSchema.paths);
        var results = [];
        for (var i = 0; i < fields.length; i++)
        {
            var settings = GameSchema.paths[fields[i]];
            results.push({
                name : fields[i],
                type : settings.instance,
                defaultValue : settings.defaultValue,
                multiline : fields[i] == 'ss' ? true : undefined, //adding custom field options example! (recommended : multiline , readOnly )
            });
        }
        return results;
    }

}