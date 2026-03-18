{
  description = "CVLT Web — paragliding club website for Club Volo Libero Ticino";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_24
            nodePackages.npm
            vips
            pkg-config
            python3
          ];

          shellHook = ''
            echo "CVLT Web dev environment"
            echo "Node $(node --version) | npm $(npm --version)"
          '';
        };
      });
}
