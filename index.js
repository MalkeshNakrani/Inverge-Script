const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const ObjectsToCsv = require("objects-to-csv");

const convert = async () => {
  try {
    const csvPath = path.join(
      __dirname,
      "output",
      "malkesh_Product_Import_Template_Definition.csv"
    );

    const result = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", () => {
          resolve(results);
          console.log("Imported output file");
        });
    });

    const fullCSVDatas = await new Promise((resolve, reject) => {
      const fullDataPath = path.join(__dirname, "data", "full.csv");
      const fullCSVData = [];
      fs.createReadStream(fullDataPath)
        .pipe(csv())
        .on("data", (data) => fullCSVData.push(data))
        .on("end", () => {
          console.log("Imported full csv file");
          resolve(fullCSVData);
        });
    });

    const supplement1Data = await new Promise((resolve, reject) => {
      const supplement1 = [];
      const supplement1Path = "./data/supplement-1.csv";
      fs.createReadStream(supplement1Path)
        .pipe(csv())
        .on("data", (data) => supplement1.push(data))
        .on("end", () => {
          console.log("Imported supplement csv file");
          resolve(supplement1);
        });
    });

    const supplement2Data = await new Promise((resolve, reject) => {
      const supplement2 = [];
      const supplement1Path = "./data/supplement-2.csv";
      fs.createReadStream(supplement1Path)
        .pipe(csv())
        .on("data", (data) => supplement2.push(data))
        .on("end", () => {
          console.log("Imported supplement csv file");
          resolve(supplement2);
        });
    });

    const outputData = fullCSVDatas.map((d) => {
      const supplement1Raw = supplement1Data.find((s) => {
        const external_sku = s.external_id.match(/\d+/);
        if (external_sku) {
          return external_sku[0].includes(d["SKU"]);
        }
        const listing_sku = s.listing_id.match(/\d+/);
        if (listing_sku) {
          return listing_sku[0].includes(d["SKU"]);
        }
        return false;
      });

      const supplement2Raw = supplement2Data.find((s) => {
        const external_sku = s["Variant SKU"]?.match(/\d+/);
        if (external_sku) {
          return external_sku[0].includes(d["SKU"]);
        }
        return false;
      });

      const Product_Grouping = d["Parent Id"];
      const taxonomy = getTaxonomy(d);
      const name = d["Name"];
      const sku = d["SKU"];
      const brand = d["Brand"];

      //   const variant_name = d[""];
      const Vendor = supplement2Raw?.["Vendor"];
      const primary_image = supplement2Raw?.["Image Src"];
      const Description = supplement2Raw?.["SEO Description"];
      const UPC = d["Barcode"];
      const price = supplement1Raw?.["price"];

      const media_condition_detail = supplement1Raw?.["media_condition"];
      const sleeve_condition_detail = supplement1Raw?.["sleeve_condition"];

      const weight = d["Weight"];
      const height = d["Height"];
      const lenght = d["Length"];
      const width = d["Width"];
      const countryOfOrigin = d["Country of origin"];

      return {
        "Product Grouping": Product_Grouping,
        Taxonomy: taxonomy,
        Name: name,
        Brand: brand,
        Vendor: Vendor,
        "Primary Image": primary_image,
        Description: Description,
        SKU: sku,
        UPC: UPC,
        price: price,
        "detail[media_condition]": media_condition_detail,
        "detail[sleeve_condition]": sleeve_condition_detail,
        Weight: weight,
        Width: width,
        Length: lenght,
        Height: height,
        "Country of Origin": countryOfOrigin,
      };
    });

    const csvData = new ObjectsToCsv(outputData);
    await csvData.toDisk("output/test.csv");

    console.log("Output is written to the file");
  } catch (error) {
    console.log("Error in convert => ", error);
  }
};

const getTaxonomy = (data) => {
  const dataValues = Object.values(data);
  let taxonomy = "";
  if (
    dataValues.filter((d) => String(d).toLowerCase().includes("cassette"))
      .length
  ) {
    taxonomy = "Music Cassette Tapes";
  }
  if (
    dataValues.filter((d) => {
      const lowerCaseValue = String(d).toLowerCase();
      return lowerCaseValue.includes("cd") || lowerCaseValue.includes("cds");
    }).length
  ) {
    taxonomy = "Music CDs";
  }
  return taxonomy;
};

(async () => {
  await convert();
})();
