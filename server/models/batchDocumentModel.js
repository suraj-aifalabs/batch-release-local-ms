module.exports = (sequelize, DataTypes) => {
    const BatchDocuments = sequelize.define("batch_documents", {
        file_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        file_size: {
            type: DataTypes.STRING,
            allowNull: false
        },
        file_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        batch_number: {
            type: DataTypes.STRING,
            allowNull: false
        },
        s3_location: {
            type: DataTypes.STRING,
            allowNull: false
        },
        uploaded_by: {
            type: DataTypes.STRING,
            allowNull: false
        },
    }, {
        schema: "public",
        tableName: "batch_documents",
        timestamps: true,
        underscored: true,
        freezeTableName: true,
        createdAt: "created_at",
        updatedAt: "updated_at"
    });

    return BatchDocuments;
};