export = function () {
  // Seems silly but really you need to be in act 2
  Town.goToTown(2);
  const staff = me.getItem("vip"),
    amulet = me.getItem("msf");

  if (!staff || !amulet) {
    return false;
  }

  Town.openStash();
  console.log('Moving amulet');
  Storage.Cube.MoveTo(amulet);
  console.log('Moving staff');
  Storage.Cube.MoveTo(staff);
  Cubing.openCube();

  print("making staff");
  transmute();
  delay(750 + me.ping);

  const finishStaff = me.getItem(91);

  if (!finishStaff) {
    return false;
  }

  Storage.Inventory.MoveTo(finishStaff);
  me.cancel();

  return true;
}