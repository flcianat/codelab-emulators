const admin = require("firebase-admin");
const functions = require("firebase-functions");
const db = admin.initializeApp().firestore();

// Recalculates the total cost of a cart; triggered when there's a change
// to any items in a cart.
exports.calculateCart = functions.firestore
  .document("carts/{cartId}/items/{itemId}")
  .onWrite(async (change, context) => {
    console.log(`onWrite: ${change.after.ref.path}`);
    if (!change.after.exists) {
      // Ignore deletes
      return;
    }

    let totalPrice = 0;
    let itemCount = 0;
    try {
      const cartRef = db.collection("carts").doc(context.params.cartId);
      const itemsSnap = await cartRef.collection("items").get();

      itemsSnap.docs.forEach((item) => {
        const itemData = item.data();
        if (itemData.price) {
          // If not specified, the quantity is 1
          const quantity = itemData.quantity ? itemData.quantity : 1;
          itemCount += quantity;
          totalPrice += itemData.price * quantity;
        }
      });

      await cartRef.update({
        totalPrice,
        itemCount,
      });

      // OPTIONAL LOGGING HERE
      console.log("Cart total successfully recalculated: ", totalPrice);
    } catch (err) {
      // OPTIONAL LOGGING HERE
      console.warn("update error", err);
    }
  });
